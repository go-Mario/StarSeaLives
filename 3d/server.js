"use strict";
/* =====================================================================
   星海公约 · 人间星海 3D —— 多人联机服务器
   纯 Node 实现，零第三方依赖：
   · 静态文件服务（3d/ 目录）
   · 手写 RFC 6455 WebSocket（握手 / 帧解析 / 帧序列化）
   · 游戏房间：玩家状态广播、聊天、记录终端发现
   运行：node 3d/server.js  （默认端口 8787）
   ===================================================================== */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname; // 3d/ 目录本身
const PORT = Number(process.env.PORT || 8787);
const TICK_MS = 66; // ~15Hz 状态广播
const MAX_PLAYERS = 24;
const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/* ---------------- 静态文件 ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};
function serve(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const file = path.normalize(path.join(ROOT, urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end("forbidden"); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

/* ---------------- WebSocket ---------------- */
function wsAccept(key) {
  return crypto.createHash("sha1").update(key + WS_MAGIC).digest("base64");
}
function encodeFrame(str) {
  const payload = Buffer.from(str, "utf8");
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}
/* 控制帧（pong / close）：小载荷、无掩码 */
function encodeControl(opcode, payload) {
  const p = payload || Buffer.alloc(0);
  return Buffer.concat([Buffer.from([0x80 | opcode, p.length]), p]);
}
/* 解析可能粘包的缓冲区，返回 {frames, rest} */
function decodeFrames(buf) {
  const frames = [];
  let i = 0;
  while (i + 2 <= buf.length) {
    const b0 = buf[i], b1 = buf[i + 1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f;
    let off = i + 2;
    if (len === 126) {
      if (off + 2 > buf.length) break;
      len = buf.readUInt16BE(off); off += 2;
    } else if (len === 127) {
      if (off + 8 > buf.length) break;
      len = Number(buf.readBigUInt64BE(off)); off += 8;
    }
    const maskLen = masked ? 4 : 0;
    if (off + maskLen + len > buf.length) break;
    let payload = buf.slice(off + maskLen, off + maskLen + len);
    if (masked) {
      const mask = buf.slice(off, off + 4);
      const out = Buffer.alloc(len);
      for (let k = 0; k < len; k++) out[k] = payload[k] ^ mask[k & 3];
      payload = out;
    }
    if (opcode === 0x8) { frames.push({ close: true }); i = off + maskLen + len; continue; }
    if (opcode === 0x9) { frames.push({ ping: true, data: payload }); i = off + maskLen + len; continue; }
    if (opcode === 0x1 || opcode === 0x2) frames.push({ text: payload.toString("utf8") });
    i = off + maskLen + len;
  }
  return { frames, rest: buf.slice(i) };
}

/* ---------------- 游戏房间 ---------------- */
const players = new Map(); // id -> {ws, name, p:[x,y,z], r:yaw, lastSeen, records:Set}
let nextId = 1;
const stationRadius = 46;

function roster() {
  const out = [];
  players.forEach((pl, id) => out.push({ id, name: pl.name, p: pl.p, r: pl.r }));
  return out;
}
function broadcast(msg, exceptId) {
  const data = encodeFrame(JSON.stringify(msg));
  players.forEach((pl, id) => { if (id !== exceptId && isOpen(pl.ws)) pl.ws.write(data); });
}
function isOpen(sock){return sock && sock.readyState==="open" && !sock.destroyed;}
function sendTo(id, msg) {
  const pl = players.get(id);
  if (pl && isOpen(pl.ws)) pl.ws.write(encodeFrame(JSON.stringify(msg)));
}
function sanitizeName(n) {
  const s = String(n == null ? "" : n).replace(/[<>&"']/g, "").trim().slice(0, 12);
  return s || "旅客";
}
function clampToStation(p) {
  const [x, y, z] = p;
  const d = Math.hypot(x, z);
  const max = stationRadius;
  if (d > max) { const k = max / d; return [x * k, y, z * k]; }
  return [x, Math.max(-14, Math.min(26, y)), z];
}
function handleMessage(id, raw) {
  let msg;
  try { msg = JSON.parse(raw); } catch (e) { return; }
  const pl = players.get(id);
  if (!pl) return;
  if (msg.t === "state" && Array.isArray(msg.p)) {
    pl.p = clampToStation(msg.p.map(Number));
    if (typeof msg.r === "number") pl.r = msg.r;
  } else if (msg.t === "chat") {
    const text = String(msg.text || "").slice(0, 140);
    if (text.trim()) broadcast({ t: "chat", from: pl.name, id, text });
  } else if (msg.t === "record") {
    const rid = String(msg.id || "").slice(0, 24);
    if (!pl.records.has(rid)) {
      pl.records.add(rid);
      broadcast({ t: "record", id: rid, by: pl.name });
      sendTo(id, { t: "record-ok", id: rid, count: pl.records.size });
    }
  }
}
function handleClose(id) {
  const pl = players.get(id);
  if (!pl) return;
  players.delete(id);
  broadcast({ t: "leave", id, name: pl.name });
}

const server = http.createServer(serve);
server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (!key) { socket.destroy(); return; }
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
    "Upgrade: websocket\r\n" +
    "Connection: Upgrade\r\n" +
    "Sec-WebSocket-Accept: " + wsAccept(key) + "\r\n\r\n"
  );
  socket.setNoDelay(true);
  const id = nextId++;
  let buf = Buffer.alloc(0);
  socket.on("data", (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    const { frames, rest } = decodeFrames(buf);
    buf = rest;
    for (const f of frames) {
      if (process.env.SS_DEBUG) console.log('[ws] frame', id, JSON.stringify(f).slice(0, 160));
      if (f.close) { try { socket.end(); } catch (e) {} handleClose(id); return; }
      if (f.ping) { try { socket.write(encodeControl(0x0a, f.data)); } catch (e) {} continue; }
      if (f.text !== undefined) {
        const pl = players.get(id);
        if (!pl) {
          // 首条消息必须是 join
          let hello = null;
          try { hello = JSON.parse(f.text); } catch (e) {}
          if (!hello || hello.t !== "join") { socket.end(); return; }
          if (players.size >= MAX_PLAYERS) { socket.end(); return; }
          players.set(id, {
            ws: socket,
            name: sanitizeName(hello.name),
            p: [0, 1.6, 14],
            r: 0,
            records: new Set(),
          });
          sendTo(id, { t: "welcome", id, name: players.get(id).name, players: roster() });
          broadcast({ t: "join", id, name: players.get(id).name }, id);
        } else {
          handleMessage(id, f.text);
        }
      }
    }
  });
  socket.on("close", () => handleClose(id));
  socket.on("error", () => handleClose(id));
});

/* 心跳与状态广播 */
setInterval(() => {
  const snapshot = roster();
  if (snapshot.length) broadcast({ t: "sync", players: snapshot });
}, TICK_MS);

server.listen(PORT, () => {
  console.log("Stellar Covenant 3D server ready:");
  console.log("  local:   http://127.0.0.1:" + PORT + "/");
  console.log("  players: open the same URL on the same network (use your LAN IP for phones)");
});
