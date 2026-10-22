"use strict";
/* =====================================================================
   星海公约 · 人间星海 3D —— 联机客户端
   three.js（本地 vendor）· 纯 WebSocket · 无其他依赖
   ===================================================================== */
const $=id=>document.getElementById(id);
let lang=(function(){try{const s=localStorage.getItem('SS3D_LANG');if(s==='zh'||s==='en')return s;}catch(e){}return (navigator.language||'zh').indexOf('zh')===0?'zh':'en';})();
const T=(zh,en)=>lang==='zh'?zh:en;

/* ---------------- 六份记录（与 2D 版同一世界） ---------------- */
const RECORDS=[
 {id:'r-lin',who:'林渡 · 中继机房',accent:0x7fc4b8,pos:[16,0,-8],
  title:{zh:'校准过的时钟',en:'The aligned clock'},
  body:{zh:'门禁记录 03:18:44，食堂终端 03:17:20。\n差 84 秒。\n把两条记录对上之后，我第一次看清：那晚有人在下班时间进了中继机房，又删掉了自己来过的那一行。\n我把原始记录交进了公共档案。后来的人，可以沿着同一条记录复核。',en:'Door reader 03:18:44. Canteen terminal 03:17:20.\nA difference of 84 seconds.\nOnce the two records aligned, I saw it for the first time: someone had entered the relay room outside hours that night, then deleted the line that said they had.\nI deposited the originals in the public archive. Those who come after can check along the same record.'}},
 {id:'r-su',who:'苏弥 · 食堂',accent:0xe0a33e,pos:[-18,0,6],
  title:{zh:'十三份早餐',en:'Thirteen breakfasts'},
  body:{zh:'姓名被撕掉了，饭盒底还有医护舱标签和过敏提示。\n我保留了过敏提示，把十三份早餐送往医护舱。\n隐私很重要，安全更重要。\n店里至今留着一张不需要预约的桌子。',en:'The names had been torn off; the box bottoms still carried the medical-compartment labels and allergy notices.\nI kept the allergy notices and sent the thirteen breakfasts to the medical bay.\nPrivacy matters. Safety matters more.\nThe canteen still keeps one table that needs no reservation.'}},
 {id:'r-xu',who:'许照 · 第九泊位',accent:0x6f9fd8,pos:[-8,0,-20],
  title:{zh:'复原的路线',en:'The rebuilt route'},
  body:{zh:'出发点、经过的舱段、最终投递点。\n按离线缓存把路线复原之后，我发现那趟快递的去向，和一份被删掉的申报单指向同一个舱段。\n错了可以重来，缓存没有丢。\n旧路线图被装进了相框，折痕没有压平。',en:'The start, the compartment along the way, the final drop.\nAfter rebuilding the route from the offline cache, I found that delivery pointed at the same compartment as a deleted declaration form.\nA wrong order can be retried; the cache is never lost.\nThe old route map was framed, creases intact.'}},
 {id:'r-jian',who:'简 · 法律援助',accent:0xb48ad0,pos:[20,0,14],
  title:{zh:'保密救治',en:'Confidential care'},
  body:{zh:'她同意紧急求助，但暂不愿公开乔安的病情。\n先协调保密救治，再按授权核对身份。\n家属的信任，比一纸声明更难补。\n那支钢笔又换了一个笔尖，仍有人用它记下当事人真正想说的话。',en:'She consented to urgent help, but not public disclosure of Jo An\'s condition.\nConfidential care first, then identity verified within consent.\nA family\'s trust is harder to rebuild than a signed statement.\nThe pen received another nib; someone still uses it to record what clients actually want to say.'}},
 {id:'r-shared',who:'公共交接簿',accent:0xdfbd87,pos:[0,0,26],
  title:{zh:'三个普通的晚上',en:'Three ordinary evenings'},
  body:{zh:'三个人的记录汇到同一本簿子上。\n没有谁拯救了世界，但每一份记录都有了一个人的重量。\n私人念头不会自动出现在这里——完成的人物行动才会留下公共记录。\n世界没有因此变得简单。',en:'Three people\'s records meet in one shared log.\nNo one saved the world, yet every record now carries the weight of a person.\nPrivate thoughts do not appear here on their own; only completed actions leave the public record.\nThe world is no simpler for it.'}},
 {id:'r-finale',who:'尾声 · 回信台',accent:0x9fd0e8,pos:[-24,0,-14],
  title:{zh:'以光速走 41 年',en:'Forty-one years at light speed'},
  body:{zh:'来自约 41 光年外的窄带信号，每 3 小时 27 分重复一次。\n回信之前：国际协商，公开过程，设定期限。\n第一句话——你好。我们听见你了。\n回声最早在 2118 年前后到达。坐在这把椅子上的人，那时还没有出生。',en:'A narrowband signal from about 41 light-years away, repeating every 3 hours 27 minutes.\nBefore replying: international consultation, an open process, a set deadline.\nThe first sentence: Hello. We heard you.\nThe earliest echo arrives around 2118. Whoever sits in this chair then has not yet been born.'}},
];
const RECORD_TIPS={
 zh:{read:'按 E 读取',near:'走近发光的记录终端',all:'六份记录都读完了。这座站上的一生，谢谢你听完。',count:function(n){return '已读 '+n+' / 6';}},
 en:{read:'Press E to read',near:'Approach a glowing record terminal',all:'All six records read. Thank you for listening to a life on this station.',count:function(n){return 'Read '+n+' / 6';}},
};

/* ---------------- 状态 ---------------- */
const self={id:0,name:'',pos:new THREE.Vector3(0,1.6,16),yaw:Math.PI,vel:new THREE.Vector3()};
const remotes=new Map(); // id -> {group,name,label,target,targetYaw,bubble,bubbleT}
let connected=false,socket=null,myRecords=new Set(),chatOpen=false;
let camYaw=Math.PI,camPitch=-0.18;
const keys={};
const BOUND=32;

/* ---------------- three.js 场景 ---------------- */
const canvas=$('scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0d1721);
scene.fog=new THREE.Fog(0x0d1721,60,240);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,0.1,1200);

/* 星空 */
(function starfield(){
 const n=2600,pos=new Float32Array(n*3);
 for(let i=0;i<n;i++){
  const r=500+Math.random()*400,t=Math.random()*Math.PI*2,p=Math.acos(2*Math.random()-1);
  pos[i*3]=r*Math.sin(p)*Math.cos(t);pos[i*3+1]=r*Math.cos(p);pos[i*3+2]=r*Math.sin(p)*Math.sin(t);
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(pos,3));
 scene.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xc0cbd0,size:1.6,sizeAttenuation:false,fog:false})));
})();

/* 地球与光晕 */
const earth=new THREE.Mesh(new THREE.SphereGeometry(90,48,48),
 new THREE.MeshBasicMaterial({color:0x2e5d72,fog:false}));
earth.position.set(-190,70,-260);scene.add(earth);
(function earthGlow(){
 const c=document.createElement('canvas');c.width=c.height=256;
 const x=c.getContext('2d'),g=x.createRadialGradient(128,128,60,128,128,128);
 g.addColorStop(0,'rgba(135,182,188,.5)');g.addColorStop(1,'rgba(135,182,188,0)');
 x.fillStyle=g;x.fillRect(0,0,256,256);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),fog:false,depthWrite:false}));
 s.scale.set(260,260,1);s.position.copy(earth.position);scene.add(s);
})();
(function sun(){
 const l=new THREE.DirectionalLight(0xfff2dd,1.15);l.position.set(60,90,40);scene.add(l);
 scene.add(new THREE.AmbientLight(0x33454f,1.1));
 const h=new THREE.HemisphereLight(0x87b6bc,0x0d1721,.5);scene.add(h);
})();

/* ---------------- 归港空间站 ---------------- */
const station=new THREE.Group();scene.add(station);
(function buildStation(){
 const metal=new THREE.MeshStandardMaterial({color:0x8b98a0,roughness:.55,metalness:.6});
 const dark=new THREE.MeshStandardMaterial({color:0x3c505c,roughness:.7,metalness:.4});
 const gold=new THREE.MeshStandardMaterial({color:0xdfbd87,roughness:.4,metalness:.5,emissive:0x2a2113});

 // 平台
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(BOUND+4,BOUND+6,1.2,64),dark);
 deck.position.y=-0.6;station.add(deck);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(BOUND+4,0.35,8,80),gold);
 rim.rotation.x=Math.PI/2;rim.position.y=0.05;station.add(rim);
 // 平台格线
 for(let r=8;r<=BOUND+2;r+=8){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.06,6,72),new THREE.MeshBasicMaterial({color:0x4a6672,fog:false}));
  ring.rotation.x=Math.PI/2;ring.position.y=0.02;station.add(ring);
 }
 // 中央舱
 const hub=new THREE.Mesh(new THREE.CylinderGeometry(4.6,5.2,26,28),metal);
 hub.position.y=13;station.add(hub);
 const hubBand=new THREE.Mesh(new THREE.CylinderGeometry(4.75,4.75,1.4,28),gold);
 hubBand.position.y=17;station.add(hubBand);
 // 环
 const ring=new THREE.Mesh(new THREE.TorusGeometry(22,2.1,14,72),metal);
 ring.rotation.x=Math.PI/2;ring.position.y=15;station.add(ring);
 station.userData.ring=ring;
 // 四条轮辐
 for(let i=0;i<4;i++){
  const a=i*Math.PI/2+Math.PI/4;
  const spoke=new THREE.Mesh(new THREE.BoxGeometry(16,0.9,1.6),metal);
  spoke.position.set(Math.cos(a)*11,15,Math.sin(a)*11);
  spoke.rotation.y=-a;station.add(spoke);
 }
 // 对接舱
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3;
  const port=new THREE.Mesh(new THREE.CylinderGeometry(1.5,1.5,4,16),dark);
  port.position.set(Math.cos(a)*22,15,Math.sin(a)*22);
  port.rotation.z=Math.PI/2;port.rotation.y=-a;station.add(port);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.28,8,8),new THREE.MeshBasicMaterial({color:i%2?0x9fd0e8:0xdfbd87}));
  lamp.position.set(Math.cos(a)*24.4,15,Math.sin(a)*24.4);station.add(lamp);
 }
 // 太阳能板
 for(const s of [-1,1]){
  const panel=new THREE.Mesh(new THREE.BoxGeometry(26,0.25,9),
   new THREE.MeshStandardMaterial({color:0x1d3a5c,roughness:.35,metalness:.7,emissive:0x0a1a2c}));
  panel.position.set(s*30,19,0);panel.rotation.z=s*0.35;station.add(panel);
  const arm=new THREE.Mesh(new THREE.BoxGeometry(7,0.4,0.4),metal);
  arm.position.set(s*16.5,18,0);station.add(arm);
 }
 // 舱内灯
 const hubLight=new THREE.PointLight(0xffe6c0,1.5,60);hubLight.position.set(0,10,0);station.add(hubLight);
 const rimLight=new THREE.PointLight(0x9fd0e8,0.9,70);rimLight.position.set(0,16,0);station.add(rimLight);
})();

/* ---------------- Avatar ---------------- */
function nameSprite(text,accent){
 const c=document.createElement('canvas');c.width=512;c.height=128;
 const x=c.getContext('2d');
 x.fillStyle='rgba(13,23,33,.72)';
 x.beginPath();x.roundRect(96,24,320,80,16);x.fill();
 x.strokeStyle='#dfbd87';x.lineWidth=3;x.stroke();
 x.font='600 44px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
 x.textAlign='center';x.textBaseline='middle';
 x.fillStyle='#e6e9e5';x.fillText(text.slice(0,10),256,66);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false,fog:false}));
 const narrow=innerWidth<560;sp.scale.set(narrow?4.2:6.4,narrow?1.05:1.6,1);sp.position.y=2.9;return sp;
}
function makeAvatar(name,accent){
 const g=new THREE.Group();
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(0.42,0.9,4,12),
  new THREE.MeshStandardMaterial({color:accent||0x5f7a8a,roughness:.5,metalness:.3}));
 body.position.y=1.05;g.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(0.34,16,16),
  new THREE.MeshStandardMaterial({color:0xc49a78,roughness:.6}));
 head.position.y=1.86;g.add(head);
 const visor=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.16,0.1),
  new THREE.MeshBasicMaterial({color:0x9fd0e8}));
 visor.position.set(0,1.9,-0.3);g.add(visor);
 g.add(nameSprite(name,accent));
 g.userData.bob=Math.random()*6;
 return g;
}

/* ---------------- 记录终端 ---------------- */
const terminals=[];
(function buildTerminals(){
 RECORDS.forEach((r,i)=>{
  const g=new THREE.Group();
  g.position.set(r.pos[0],0,r.pos[2]);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.1,0.5,16),
   new THREE.MeshStandardMaterial({color:0x3c505c,roughness:.6,metalness:.5}));
  base.position.y=0.25;g.add(base);
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,2.2,12),
   new THREE.MeshStandardMaterial({color:0x8b98a0,roughness:.4,metalness:.7}));
  pillar.position.y=1.5;g.add(pillar);
  const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(0.55),
   new THREE.MeshStandardMaterial({color:r.accent,emissive:r.accent,emissiveIntensity:.9,roughness:.2,metalness:.1,fog:false}));
  crystal.position.y=3.1;g.add(crystal);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.15,0.07,8,40),
   new THREE.MeshBasicMaterial({color:r.accent,fog:false,transparent:true,opacity:.85}));
  halo.rotation.x=Math.PI/2;halo.position.y=0.32;g.add(halo);
  const light=new THREE.PointLight(r.accent,1.1,14);light.position.y=3;g.add(light);
  station.add(g);
  terminals.push({def:r,group:g,crystal,halo,read:false,index:i});
 });
})();

/* ---------------- 输入 ---------------- */
addEventListener('keydown',e=>{
 if(e.target.tagName==='INPUT')return;
 keys[e.code]=true;
 if(e.code==='Enter'){e.preventDefault();toggleChat();}
 if(e.code==='KeyE'&&!chatOpen)tryRead();
 if(e.code==='Escape'){closeRecord();}
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});

/* 拖动转视角 */
let dragging=null;
canvas.addEventListener('pointerdown',e=>{dragging={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
 if(!dragging||e.pointerId!==dragging.id)return;
 const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;
 dragging.x=e.clientX;dragging.y=e.clientY;
 camYaw-=dx*0.0052;camPitch=Math.max(-1.2,Math.min(0.55,camPitch-dy*0.004));
});
['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,()=>{dragging=null;}));

/* 手机摇杆 */
const isTouch=matchMedia('(pointer:coarse)').matches;
const stick={active:false,dx:0,dy:0};
(function touchStick(){
 const el=$('stick'),knob=el.querySelector('.knob');
 let origin=null;
 el.addEventListener('pointerdown',e=>{e.preventDefault();origin=el.getBoundingClientRect();stick.active=true;move(e);});
 el.addEventListener('pointermove',e=>{if(stick.active)move(e);});
 ['pointerup','pointercancel','pointerleave'].forEach(ev=>el.addEventListener(ev,()=>{stick.active=false;stick.dx=stick.dy=0;knob.style.transform='translate(-50%,-50%)';}));
 function move(e){
  if(!origin)return;
  const cx=origin.left+origin.width/2,cy=origin.top+origin.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const d=Math.hypot(dx,dy),max=origin.width/2-14;
  if(d>max){dx*=max/d;dy*=max/d;}
  stick.dx=dx/max;stick.dy=dy/max;
  knob.style.transform='translate(calc(-50% + '+dx+'px),calc(-50% + '+dy+'px))';
 }
 if(isTouch)$('touchUi').classList.add('on');
})();
function bindHold(id,code){
 const b=$(id);
 b.addEventListener('pointerdown',e=>{e.preventDefault();keys[code]=true;});
 ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{keys[code]=false;}));
}
bindHold('btnUp','KeyQ');bindHold('btnDown','KeyE');
$('btnRead').addEventListener('pointerdown',e=>{e.preventDefault();tryRead();});
/* 右半屏拖动转视角（手机） */
(function touchLook(){
 let last=null;
 canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&e.clientX>innerWidth*0.42)last=e;});
 canvas.addEventListener('pointermove',e=>{
  if(!last||e.pointerId!==last.pointerId)return;
  const dx=e.clientX-last.clientX,dy=e.clientY-last.clientY;
  last.clientX=e.clientX;last.clientY=e.clientY;
  camYaw-=dx*0.006;camPitch=Math.max(-1.2,Math.min(0.55,camPitch-dy*0.005));
 });
 ['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,()=>{last=null;}));
})();

/* ---------------- HUD ---------------- */
function sysLine(text){const d=document.createElement('div');d.className='sys';d.textContent=text;$('chatLog').appendChild(d);$('chatLog').scrollTop=1e9;}
function chatLine(from,text){const d=document.createElement('div');d.innerHTML='<b></b>';d.querySelector('b').textContent=from+': ';d.appendChild(document.createTextNode(text));$('chatLog').appendChild(d);$('chatLog').scrollTop=1e9;}
function toggleChat(){
 chatOpen=!chatOpen;
 $('chatInput').classList.toggle('on',chatOpen);
 if(chatOpen)$('chatText').focus();else $('chatText').blur();
}
$('chatSend').addEventListener('click',sendChat);
$('chatText').addEventListener('keydown',e=>{
 if(e.key==='Enter'){e.preventDefault();sendChat();}
 e.stopPropagation();
});
function sendChat(){
 const v=$('chatText').value.trim();
 if(!v)return;
 send({t:'chat',text:v});
 chatLine(self.name,v);
 $('chatText').value='';
 chatOpen=false;$('chatInput').classList.remove('on');
}
$('helpBtn').addEventListener('click',()=>$('helpOverlay').classList.remove('hidden'));
$('helpClose').addEventListener('click',()=>$('helpOverlay').classList.add('hidden'));
$('rpClose').addEventListener('click',closeRecord);

/* 语言 */
function applyLang(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';
 $('language').value=lang;
 $('joinTitle').textContent=T('星海公约 · 人间星海 3D','Stellar Covenant · Ordinary Lives 3D');
 $('joinSub').textContent=T('归港空间站 · 多人联机样片。走进去，读取六份记录，听听这座站上四个人的一生。','Homeward Station · a multiplayer prototype. Walk in, read six records, and listen to four lives on this station.');
 $('joinBtn').textContent=T('进入空间站','Enter the station');
 $('nameInput').placeholder=T('你的名字','Your name');
 $('chatText').placeholder=T('说点什么…','Say something…');
 $('chatSend').textContent=T('发送','Send');
 $('rpClose').textContent=T('合上','Close');
 $('recordHint').innerHTML=T('按 <span class="key">E</span> 读取','Press <span class="key">E</span> to read');
 document.title=T('星海公约 · 人间星海 3D','Stellar Covenant · Ordinary Lives 3D');
 updateOnline();
}
$('language').addEventListener('change',e=>{
 lang=e.target.value;
 try{localStorage.setItem('SS3D_LANG',lang);}catch(err){}
 applyLang();
 refreshRecordPanel();
});

/* ---------------- 记录终端 ---------------- */
let nearTerminal=null,panelOpen=false;
function tryRead(){ if(nearTerminal) openRecord(nearTerminal); }
function openRecord(tm){
 if(tm.read)return;
 tm.read=true;myRecords.add(tm.def.id);
 tm.crystal.material.emissiveIntensity=0.25;
 tm.halo.material.color.set(0x5a6a72);
 send({t:'record',id:tm.def.id});
 panelOpen=true;
 const r=tm.def;
 $('rpEyebrow').textContent=T('归港站 · 记录终端','Homeward Station · record terminal')+' · '+(tm.index+1)+'/6';
 $('rpTitle').textContent=r.title[lang];
 $('rpBody').textContent=r.body[lang];
 $('rpWho').textContent=r.who;
 $('rpCount').textContent=myRecords.size>=6?RECORD_TIPS[lang].all:RECORD_TIPS[lang].count(myRecords.size);
 $('recordPanel').classList.remove('hidden');
}
function closeRecord(){panelOpen=false;$('recordPanel').classList.add('hidden');}
function refreshRecordPanel(){ if(panelOpen&&nearTerminal){ $('rpTitle').textContent=nearTerminal.def.title[lang]; $('rpBody').textContent=nearTerminal.def.body[lang]; $('rpCount').textContent=myRecords.size>=6?RECORD_TIPS[lang].all:RECORD_TIPS[lang].count(myRecords.size);} }

/* ---------------- 网络 ---------------- */
function send(obj){ if(socket&&socket.readyState===1)socket.send(JSON.stringify(obj)); }
function connect(){
 const proto=location.protocol==='https:'?'wss':'ws';
 socket=new WebSocket(proto+'://'+location.host);
 socket.addEventListener('open',()=>{ connected=true; send({t:'join',name:self.name}); setNet(); });
 socket.addEventListener('close',()=>{ connected=false; setNet(); sysLine(T('连接已断开，3 秒后重连…','Disconnected. Reconnecting in 3s…')); setTimeout(connect,3000); });
 socket.addEventListener('error',()=>{});
 socket.addEventListener('message',ev=>{
  let m;try{m=JSON.parse(ev.data);}catch(e){return;}
  if(m.t==='welcome'){
   self.id=m.id;self.name=m.name;
   sysLine(T('已接入归港站。','Connected to Homeward Station.'));
   const others=(m.players||[]).filter(p=>p.id!==self.id);
   others.forEach(p=>addRemote(p));
   if(others.length)sysLine(T('站上已有 '+others.length+' 位旅客。',others.length+' traveller(s) already on the station.'));
   updateOnline();
  }else if(m.t==='join'){
   addRemote({id:m.id,name:m.name,p:[0,1.6,14],r:0});
   sysLine(m.name+T(' 进入了空间站。',' joined the station.'));
   updateOnline();
  }else if(m.t==='leave'){
   const r=remotes.get(m.id);if(r){station.remove(r.group);remotes.delete(m.id);}
   sysLine(m.name+T(' 离开了空间站。',' left the station.'));
   updateOnline();
  }else if(m.t==='sync'){
   (m.players||[]).forEach(p=>{
    if(p.id===self.id)return;
    let r=remotes.get(p.id);
    if(!r){r=addRemote(p);}
    r.target.set(p.p[0],p.p[1],p.p[2]);r.targetYaw=p.r;
   });
   updateOnline();
  }else if(m.t==='chat'){
   const r=remotes.get(m.id);
   if(r)showBubble(r,m.text);
   chatLine(m.from,m.text);
  }else if(m.t==='record'){
   const tm=terminals.find(t=>t.def.id===m.id);
   if(tm&&!tm.read){tm.read=true;tm.crystal.material.emissiveIntensity=0.25;tm.halo.material.color.set(0x5a6a72);}
   sysLine(m.by+T(' 读取了一份记录。',' read a record.'));
  }
 });
}
function addRemote(p){
 const colors=[0x7fc4b8,0xe0a33e,0x6f9fd8,0xb48ad0,0x9fd0e8,0xdfa0a0];
 const accent=colors[p.id%colors.length];
 const group=makeAvatar(p.name,accent);
 group.position.set(p.p[0],p.p[1],p.p[2]);
 station.add(group);
 const r={group,name:p.name,target:new THREE.Vector3(p.p[0],p.p[1],p.p[2]),targetYaw:p.r||0,bubble:null,bubbleT:0};
 remotes.set(p.id,r);
 return r;
}
function showBubble(r,text){
 if(r.bubble){station.remove(r.bubble);r.bubble=null;}
 const c=document.createElement('canvas');c.width=512;c.height=128;
 const x=c.getContext('2d');
 x.fillStyle='rgba(13,23,33,.8)';x.beginPath();x.roundRect(8,8,496,112,18);x.fill();
 x.strokeStyle='#50616a';x.lineWidth=3;x.stroke();
 x.font='34px -apple-system,"PingFang SC",sans-serif';x.textAlign='center';x.textBaseline='middle';
 x.fillStyle='#e6e9e5';
 let t=text.slice(0,20);if(text.length>20)t=text.slice(0,19)+'…';
 x.fillText(t,256,64);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthWrite:false}));
 sp.scale.set(5.6,1.4,1);sp.position.y=3.9;
 r.group.add(sp);r.bubble=sp;r.bubbleT=4;
}
function setNet(){
 const el=$('net');
 el.textContent=connected?T('已连接','Connected'):T('未连接','Offline');
 el.className='pill '+(connected?'ok':'warn');
}
function updateOnline(){
 $('online').innerHTML='<b>'+remotes.size+'</b> '+T('在线','online');
}

/* ---------------- 主循环 ---------------- */
const clock=new THREE.Clock();
let lastSend=0,moved=false;
function frame(){
 requestAnimationFrame(frame);
 const dt=Math.min(clock.getDelta(),0.05);
 const t=clock.elapsedTime;

 /* 自身移动 */
 let mx=0,mz=0,my=0;
 if(keys.KeyW)mz-=1; if(keys.KeyS)mz+=1;
 if(keys.KeyA)mx-=1; if(keys.KeyD)mx+=1;
 if(keys.KeyQ)my+=1; if(keys.KeyE)my-=1;
 if(stick.active){mx+=stick.dx;mz+=stick.dy;}
 if(chatOpen||panelOpen){mx=mz=my=0;}
 const len=Math.hypot(mx,mz);
 if(len>1){mx/=len;mz/=len;}
 const speed=(keys.ShiftLeft||keys.ShiftRight?11:6)*(chatOpen?0:1);
 const sin=Math.sin(camYaw),cos=Math.cos(camYaw);
 const dx=(mx*cos-mz*sin)*speed,dz=(mx*sin+mz*cos)*speed;
 self.vel.x+=(dx-self.vel.x)*Math.min(1,dt*10);
 self.vel.z+=(dz-self.vel.z)*Math.min(1,dt*10);
 self.pos.x+=self.vel.x*dt;
 self.pos.z+=self.vel.z*dt;
 self.pos.y+=(my*6-self.vel.y*0+ (self.pos.y>1.6&&my===0&&!keys.KeyQ?(1.6-self.pos.y)*4:0))*dt;
 if(keys.KeyQ||keys.KeyE)self.pos.y+=my*5*dt;
 self.pos.y=Math.max(0.9,Math.min(22,self.pos.y));
 const d=Math.hypot(self.pos.x,self.pos.z);
 if(d>BOUND){self.pos.x*=BOUND/d;self.pos.z*=BOUND/d;}
 self.yaw=camYaw+Math.PI;
 if(Math.hypot(self.vel.x,self.vel.z)>0.4)moved=true;

 /* 相机（第三人称跟随） */
 const cp=Math.cos(camPitch),sp=Math.sin(camPitch);
 const camDist=7.5;
 const cx=self.pos.x+sin*cp*camDist, cy=self.pos.y+3.1-sp*camDist, cz=self.pos.z+cos*cp*camDist;
 camera.position.lerp(new THREE.Vector3(cx,Math.max(0.6,cy),cz),Math.min(1,dt*8));
 camera.lookAt(self.pos.x,self.pos.y+1.6,self.pos.z);

 /* 自身 avatar（本地可见，便于回头看到自己） */
 if(!self.avatar){
  self.avatar=makeAvatar(self.name||T('我','Me'),0xdfbd87);
  station.add(self.avatar);
 }
 self.avatar.position.copy(self.pos);
 self.avatar.rotation.y=self.yaw;
 const bob=Math.sin(t*8+self.avatar.userData.bob)*Math.min(0.06,Math.hypot(self.vel.x,self.vel.z)*0.012);
 self.avatar.position.y=self.pos.y+bob;
 self.avatar.children[0].rotation.x=bob*0.4;

 /* 记录终端动画与 proximity */
 nearTerminal=null;let bestD=5;
 terminals.forEach(tm=>{
  tm.crystal.rotation.y=t*1.4+tm.index;
  tm.crystal.position.y=3.1+Math.sin(t*1.6+tm.index)*0.12;
  tm.halo.rotation.z=t*0.8;
  if(!tm.read){
   const dd=Math.hypot(self.pos.x-tm.group.position.x,self.pos.z-tm.group.position.z);
   if(dd<bestD){bestD=dd;nearTerminal=tm;}
  }
 });
 const tip=$('centerTip');
 if(nearTerminal&&!panelOpen){
  $('recordName').textContent=nearTerminal.def.title[lang];
  tip.classList.remove('hidden');
 }else tip.classList.add('hidden');

 /* 远端玩家插值 */
 remotes.forEach(r=>{
  r.group.position.lerp(r.target,Math.min(1,dt*9));
  const ry=r.group.rotation.y;
  r.group.rotation.y=ry+(r.targetYaw-ry)*Math.min(1,dt*9);
  if(r.bubbleT>0){r.bubbleT-=dt;if(r.bubbleT<=0&&r.bubble){r.group.remove(r.bubble);r.bubble=null;}}
 });

 /* 状态发送（15Hz，仅在有移动时） */
 if(moved&&t-lastSend>0.066){
  send({t:'state',p:[self.pos.x,self.pos.y,self.pos.z],r:self.yaw});
  moved=false;lastSend=t;
 }

 /* 空间站环缓慢旋转 */
 station.userData.ring.rotation.z=t*0.02;

 renderer.render(scene,camera);
}

/* ---------------- 加入流程 ---------------- */
$('joinBtn').addEventListener('click',()=>{
 const v=$('nameInput').value.trim().replace(/[<>&"']/g,'').slice(0,12);
 self.name=v||T('旅客','Traveler');
 if(self.avatar){station.remove(self.avatar);self.avatar=null;}
 $('joinOverlay').classList.add('hidden');
 $('hud').classList.remove('hidden');
 sysLine(T('正在接入归港站…','Connecting to Homeward Station…'));
 connect();
});
$('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter')$('joinBtn').click();e.stopPropagation();});
try{const saved=localStorage.getItem('SS3D_NAME');if(saved)$('nameInput').value=saved;}catch(e){}
$('joinBtn').addEventListener('click',()=>{try{localStorage.setItem('SS3D_NAME',self.name);}catch(e){}});

/* 窄屏（竖屏手机）保持水平视野，否则画面会像被怼近；名字牌同步缩小 */
const BASE_FOV=58;
function fitView(){
 const aspect=innerWidth/innerHeight;
 camera.aspect=aspect;
 camera.fov=aspect<1?Math.min(88,2*Math.atan(Math.tan(BASE_FOV*Math.PI/360)/Math.max(.42,aspect))*180/Math.PI):BASE_FOV;
 camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
 const narrow=innerWidth<560;
 if(self.avatar){
  const sp=self.avatar.children.find(c=>c.isSprite);
  if(sp)sp.scale.set(narrow?4.2:6.4,narrow?1.05:1.6,1);
 }
 remotes.forEach(r=>{
  const sp=r.group.children.find(c=>c.isSprite);
  if(sp)sp.scale.set(narrow?4.2:6.4,narrow?1.05:1.6,1);
 });
}
addEventListener('resize',fitView);

applyLang();
fitView();
setNet();
frame();
