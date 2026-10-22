# 《人间星海》2D 版上架步骤：微信 / 苹果 / Steam

面向当前仓库根目录的 2D 单机版（纯 HTML/CSS/JS，零依赖，`tools/build.py` 产出单文件）。
三平台的技术难度、资质门槛、成本完全不同，**建议顺序：Steam → 苹果海外区 → 微信**。

| | Steam | 苹果 App Store | 微信小游戏 |
| --- | --- | --- | --- |
| 技术改造 | 小（Electron/Tauri 套壳） | 小（Capacitor 套壳） | **大**（DOM 全改 Canvas） |
| 主体要求 | 个人可（需税表） | 个人可 | 个人可注册，但游戏类目需软著 |
| 版号 | 全球版不需要 | 海外区不需要；**中国区需要** | 目前不强制（以当期政策为准） |
| 费用 | $100/款（一次性，可回本） | $99/年 | 个人免费 / 企业认证 300 元/年 |
| 审核周期 | 商店页 1–5 天 + 构建 1–5 天 | 1–3 天（首次可能更久） | 1–7 天 |
| 分成 | 30%（满 $1000 后 25%…以 Steamworks 条款为准） | 15%（小企业计划） | 微信支付通道费 |

---

## 一、Steam（推荐第一步）

### 1. 账号与资质
1. 注册 **Steamworks** 账号（partner.steamgames.com），绑定邮箱与手机。
2. 缴纳 **Steam Direct 费用 $100/款**（卖出 $1,000 后返还到账户）。
3. 填写税务表（中国个人填 **W-8BEN**，需要身份证/护照信息）与收款银行账户。
4. 签署《Steam 分发协议》。

### 2. 打包（Electron 最省事）
```bash
# 在仓库根目录
npm init -y
npm i -D electron electron-builder
# main.js：一个 BrowserWindow 加载 dist/index.html，锁 1280×800，禁用菜单
npx electron-builder --win --mac   # 产出 exe / dmg
```
- 单文件 `dist/index.html` 直接当本地页面加载，**不需要服务器**。
- 注意：Steam 要求 64 位构建；Windows 用 NSIS 安装包，macOS 需签名（无签名可先只上 Windows）。
- 存档在 localStorage（Electron 的用户数据目录），可用 `app.getPath('userData')` 做导入导出。

### 3. 商店页素材（缺一不可）
| 素材 | 规格 |
| --- | --- |
| 主胶囊图 | 616×353 |
| 小胶囊图 | 231×87 |
| 头图 | 460×215 |
| 竖版胶囊 | 748×896 |
| 背景图 | 1434×810 |
| 截图 | 至少 5 张 1920×1080 |
| 预告片 | 30–60 秒，1920×1080，H.264 |

### 4. 提审
1. Steamworks → 应用管理 → 创建应用 → 填写商店页（名称、简介、标签：叙事 / 视觉小说 / 选择取向）。
2. 提交商店页审核（1–5 天）。
3. 上传构建（SteamPipe），设置启动项，提交构建审核。
4. 通过后手动点「发布」。建议先做 **Playtest / 免费 Demo** 收集反馈。

### 5. 合规
- 年龄分级：IARC 问卷（免费，几分钟）。
- 隐私：不采集数据就不需要隐私政策页，但商店页要写明。
- **中国区**：Steam 全球版不强制版号；若要上「蒸汽平台」（Steam 中国），必须版号 + 企业主体。

---

## 二、苹果 App Store（第二步，先上海外区）

### 1. 账号
1. 注册 **Apple ID** → 加入 **Apple Developer Program**（$99/年，个人身份即可，需身份证 + 信用卡）。
2. 在 App Store Connect 创建 App，Bundle ID 例如 `com.gomario.starsealives`。

### 2. 打包（Capacitor）
```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init "人间星海" com.gomario.starsealives --web-dir=dist
npx cap add ios
npx cap sync ios
npx cap open ios      # Xcode 里设置签名、图标、启动屏
```
- 把 `dist/` 作为 web 目录，页面零改动。
- 需要：App 图标（1024×1024）、启动屏、`Info.plist` 里的横竖屏与 safe-area。
- 音频：首次触摸后启动，现有逻辑已兼容 WKWebView。

### 3. 提审要点
- **3.1.1**：如要解锁内容，必须走 IAP；本作可做「免费下载 + 完整内容」，最省事。
- **4.7**：网页套壳 App 需保证不是「仅一个网站」，要有原生质感（离线可玩、无浏览器地址栏）。
- 隐私清单（Privacy Manifest）：声明不采集数据。
- 年龄分级问卷；中国区上架**必须版号**，海外区不需要。
- 用 **TestFlight** 先内测（最多 1 万名）。

---

## 三、微信小游戏（第三步，工作量最大）

### 关键限制（先看这个，决定要不要做）
- **个人主体不能用 `<web-view>`**（小程序内嵌网页需要企业主体）。所以「网页直接塞进去」这条路对个人走不通。
- 因此要么：**A. 迁移成小游戏（Canvas 重写 UI）**，要么 **B. 注册公司主体后用 web-view 容器**。
- 小游戏 **iOS 端禁止虚拟支付**（苹果政策），付费设计要绕开。

### A. 迁移成小游戏（推荐）
1. 注册小程序账号（mp.weixin.qq.com）→ 服务类目选「小游戏」→ 个人主体可注册。
2. 办理 **《计算机软件著作权登记证书》**（中国版权保护中心，个人可办，1–2 个月）。游戏类目提审需要。
3. 安装**微信开发者工具**，新建「小游戏」项目。
4. 适配层（工作量集中在这里）：

| 现有 | 小游戏 |
| --- | --- |
| DOM 界面 | Canvas 2D 自绘（或用轻量 UI 框架） |
| `localStorage` | `wx.setStorageSync` / `getStorageSync` |
| Web Audio | `wx.createInnerAudioContext()`（首次触摸后播放） |
| 点击 / 触摸 | `wx.onTouchStart/Move/End` |
| 存档导入导出 | `wx.getFileSystemManager()` 写沙箱文件 |
| 屏幕适配 | `wx.getSystemInfoSync()` + 安全区 |

5. 先只迁移「主页 + 第一章 + 一个人物」做试玩版，验证留存再全量迁移。
6. 真机调试 → 体验版（10–20 人）→ 提审 → 发布。

### B. 企业主体 + web-view 容器（省开发，费资质）
1. 注册公司 → 小程序企业认证（300 元/年）。
2. 用 `<web-view src="https://你的域名/...">` 加载现有页面，域名需备案并配置业务域名。
3. 审核时说明「自有内容、非纯外链」，否则容易被拒。

### 商业化
- 免费 + 激励视频（`wx.createRewardedVideoAd`）+ 外观内购（微信支付）。
- **不要**设计「付费变强 / 付费解锁主线」，iOS 端会被拒。

---

## 四、建议时间表

| 周 | 动作 |
| --- | --- |
| 第 1 周 | 办软著（并行）；Electron 打包，Steam 商店页素材 |
| 第 2–3 周 | Steam 商店页 + 构建提审；同时做 TestFlight |
| 第 4 周 | Steam 上线（可先 Demo）；苹果海外区提交 |
| 第 5 周起 | 视数据决定是否投入小游戏迁移（2–4 周开发） |

**判断标准**：Steam 愿望单 / Demo 留存是成本最低的信号。数据好，再投入小游戏迁移与版号；
数据一般，就继续打磨内容——内容才是这类作品的护城河。
