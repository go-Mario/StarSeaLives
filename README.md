<div align="center">

# 人间星海 · Ordinary Lives

**一座空间站，四个人，五十年。你只知道 ta 能知道的事。**

[在线游玩](https://go-mario.github.io/StarSeaLives/) · [下载离线单文件](dist/index.html) · [English](#english)

</div>

---

## 这是什么

2077 年，归港空间站。

维修员在夜里修好了中继机房的时钟；食堂经营者把十三份早餐送去了医护舱；
快递员按离线缓存复原了一条不该存在的路线；法律援助律师签下了一份保密救治的授权。

四段人生，六个相互牵连的事件，从 2077 年一直走到 2127 年。
你每次只扮演其中一个人，只看见 ta 能看见的东西——
**同一件事，在不同人的记录里，是四个不同的故事。**

## 玩法

- **四条人物线**，各自独立存档；同一个人物可以重玩，换一种可能
- **每幕三段**：读材料 → 做一次调查 → 下一个决定。决定会留下后果
- **调查各不相同**：校准设备时钟、在餐食信息里保留关键提示、按记录复原路线、按授权核对身份
- **站内检索**：用找到的编号或地点检索档案，命中会标出来源与范围
- **没有倒计时，搜错不扣分**；想慢慢读就慢慢读
- **手记**：每个选择、每条记录都留在人物手记里，结局会回看它们
- **四种休憩**：空间站对接、翻牌、调频、呼吸停留——不影响主线，只影响你自己

## 开始游戏

**在线**：<https://go-mario.github.io/StarSeaLives/>

**本地**：

```bash
python3 -m http.server 8766
# 打开 http://127.0.0.1:8766/
```

**离线单文件**：直接双击 `dist/index.html`，不需要服务器、不联网。

## 操作

| 平台 | 操作 |
| --- | --- |
| 电脑 | 点击选项推进；`Tab` 在可交互处移动；`Esc` 关闭面板 |
| 手机 | 点按推进，竖屏优先，适配刘海屏安全区 |

## 语言

中文 / English 随时切换，进度与线索不丢。
所有人物对白、卷宗、按钮与提示均为双语，同一处维护。

## 无障碍

- 尊重系统「减少动态效果」偏好，动画会自动收敛
- 无时间压力、无失败惩罚、无强制重复操作
- 音效与音乐可单独关闭

## 技术

- **零第三方依赖**：纯 HTML / CSS / JavaScript，无框架、无 CDN、无网络请求
- 音乐与音效实时合成（Web Audio），不使用采样素材
- 存档在浏览器本地，可导出 / 导入 JSON；损坏时可从备份恢复
- 四个人物各用独立存档键，互不覆盖

```bash
python3 tools/build.py          # 生成离线单文件
python3 tools/build.py --check  # 校验单文件与源码一致
```

## 说明

故事、人物、机构均为虚构，与任何现实政府、企业或个人无关。
本作不含内购，不采集个人信息。

设计笔记：[世界路线](docs/WORLD_ROADMAP.md) · [平台计划](docs/LAUNCH-2D.md) · [机制研究](docs/RESEARCH-2026-10-21.md) · [验证记录](docs/VERIFICATION-2026-10-21.md)

---

<a id="english"></a>

## English

**One station. Four people. Fifty years. You know only what they can know.**

2077, Homeward Station. A maintenance engineer realigns a clock in the relay room. A canteen keeper
sends thirteen breakfasts to the medical bay. A courier rebuilds a route that should not exist.
A legal-aid lawyer signs an authorisation for confidential care.

Four lives, six connected events, from 2077 to 2127. You play one person at a time and see only
what they can see — **the same event is four different stories in four different records.**

**Play:** [online](https://go-mario.github.io/StarSeaLives/) · or open `dist/index.html` offline.

**Features**

- Four separate lives, each with its own save; replay a life for another possibility
- Each act: read the material, run one investigation, make one choice — choices leave consequences
- Investigations differ by role: calibrate a device clock, keep a safety detail in a meal order,
  rebuild a route from a cache, verify identity within consent
- Station archive search, with sources and limits shown
- No timers, no penalties for wrong guesses
- A life journal that keeps every choice and record, revisited in the ending
- Four optional rest activities that never gate the main story
- Full Chinese / English switch at any time without losing progress
- No dependencies, no network requests, no microtransactions; all audio synthesised at runtime

**Note:** all characters, institutions and events are fictional and unrelated to any real
government, company or person.
