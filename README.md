# ⛳ Golf Overlay — 高尔夫赛事角标助手

**Masters-style broadcast golf shot info overlay generator**
作者 / Contact: szpack@qq.com

---

## 🌐 在线访问 / Live Demo

**GitHub Pages:** https://szpack.github.io/GolfOverlay/

---

## 快速使用 / Quick Start

1. 打开 `index.html`（Chrome / Safari / iPhone）
2. 在下方控制栏依次设置：**球员姓名 → 洞号 → Par → 距离 → 击球类型**
3. 点击 **"NEXT SHOT ▶"** 推进击球计数
4. 本洞完成后选择成绩（Birdie / Par / Bogey …）
5. 点击 **"Create Overlay PNG"** → 下载透明 PNG

---

## 📺 OBS Browser Source 推荐设置

| 参数 | 推荐值 |
|------|--------|
| **URL** | `https://szpack.github.io/GolfOverlay/` 或本地 `file:///…/index.html` |
| **Width** | `1920` |
| **Height** | `1080` |
| **FPS** | `60` |
| **Custom CSS** | _(留空)_ |
| **Shutdown source when not visible** | 勾选（节省资源） |
| **Refresh browser when scene becomes active** | 勾选 |

> 导出分辨率建议与 OBS 输出分辨率一致（1080p 或 4K）。

---

## 导出说明 / Export

| 选项 | 说明 |
|------|------|
| **4K (2160p)** | 3840×2160，适合 4K 剪辑 |
| **1440P** | 2560×1440 |
| **1080P** | 1920×1080，标准高清 |

导出文件名格式：`hole01_shot02_approach_2160p.png`

---

## 整场记录 / Round Scoring

- 每次点击"→ NEXT"时，当前洞成绩自动写入 18 洞计分卡
- 底部显示计分卡条（18 洞全程）+ 总杆数 / 杆差
- 在 **设置 ⚙** 中可开启"本场总分"在角标上显示（Gross 或 To Par）

---

## 参考背景图 / Reference Background

- 点击预览区空白处上传照片作为背景参考
- 背景仅用于预览对齐，**不会出现在导出 PNG 中**
- 在**设置 ⚙ → Background Image**中调节透明度 / 清除

---

## 数据存储 / Data Persistence

- 所有状态通过 **localStorage** 自动保存（key: `golf_v531`）
- 刷新页面后自动恢复
- 清空本轮：点击 **New…** 按钮（有确认弹窗）

---

## 键盘快捷键 / Keyboard Shortcuts

| 键 | 功能 |
|----|------|
| `→` / `.` | 下一杆 Next Shot |
| `←` / `,` | 上一杆 Prev Shot |
| `H` | 下一洞 Next Hole |

---

## 项目结构 / Project Structure

```
GolfOverlay/
├── index.html          # 页面主入口
├── css/overlay.css     # 全部样式
├── js/
│   ├── scoreboard.js   # 计分卡逻辑
│   ├── ui.js           # 界面操作
│   └── app.js          # 应用核心 & Canvas 渲染
├── assets/icons/       # 图标资源（备用）
├── bkimg.jpeg          # 默认背景图
├── archive/            # 历史版本存档
├── docs/               # 设计文档
└── CLAUDE.md           # AI 开发说明
```

---

## 技术架构 / Architecture

```
No build step · No external dependencies · Vanilla JS + Canvas
├── scoreboard.js  — 成绩计算、颜色映射、Canvas 计分卡绘制
├── ui.js          — DOM 操作、事件绑定、面板刷新
└── app.js         — 全局状态 S{}、持久化、Canvas 引擎、导出
```

---

## Changelog

<!-- Claude: keep this section updated. Newest on top. -->

### v5.4.0 — 2026-03-04
- 计分卡信息版保持完整 18 洞格子；当前洞 N 时仅在 1~(N-1) 洞格内填入成绩，当前洞及后续洞格留空；总杆仅按已完成洞之和计算；洞 1 时不显示
- 新增汇总视图：点击 F/B/T 统计卡分别切换至 OUT(1-9) / IN(10-18) / TOT(1-18) 显示
- 点击任意洞号卡或 → NEXT 时自动退出汇总视图，恢复 hole 视图

### v5.3.4 — 2026-03-04
- 击球信息版初始位置修正为右上角（x=0.695, y=0.05），遵守 5% 安全边界
- 计分卡信息版初始 y 值按比例修正（16:9→0.76, 9:16→0.89, 1:1→0.84），底边不再超出安全区

### v5.3.3 — 2026-03-04
- OUT/IN 统计改为白底黑字（不再沿用成绩色块）
- 击球信息版右侧区域加宽 10px（SHOT_W 480→490，左列宽度不变）
