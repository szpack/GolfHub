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

### v6.4.4 — 2026-03-05
- Export 区重新分组：Shots 组（Shot PNG + Hole Shots ZIP）/ Scorecard 组（Scorecard PNG + 18 SC ZIP）
- ZIP 按钮为绿色主按钮，PNG 按钮为 outline 样式
- 分辨率 + 透明度设置折叠到 Options… 按钮下方（默认隐藏）
- 按钮间距 8px，分组间距 16px；导出逻辑完全不变

### v6.4.3 — 2026-03-05
- Par 按钮加大（22px 粗体），选中态绿色；底边与 HOLE X 底边对齐（align-items:flex-end）

### v6.4.2 — 2026-03-05
- 修复 Final Score 区域多余左侧绿色竖条（移除 #delta-section border-left）
- 左侧导航区统一新视觉规范：#ptool/#nav/#left 使用 --panel-bg + --panel-border
- 比例按钮（16:9/9:16/1:1）、To Par/Gross 按钮：transparent 底 + panel-border；选中态 --accent-green
- 18 洞卡片当前洞高亮、F/B/T 统计卡激活态统一改用 --accent-green
- F/B/T 统计卡标签金色改用 --accent-gold；SC 开关/Radio 勾选色改用 --accent-green

### v6.4.1 — 2026-03-05
- 统一右侧控制区视觉系统：新增 CSS Design Tokens（--accent-gold/green, --panel-bg, --panel-border, --text-primary/muted）
- 右侧面板背景改为 #1f1f1f，所有区块分割线改用 --panel-border (#2c2c2c)
- 所有未选按钮统一为 transparent 背景 + panel-border 边框；选中态统一用 --accent-green (#22c55e)
- Par 数字、Par 标签改用 --accent-gold；Final Score 左侧边条改用 --accent-green
- .stitle 统一 12px / 0.08em letter-spacing / text-muted 颜色
- 导出按钮、进度条统一使用 --accent-green；无 JS 改动

### v6.4.0 — 2026-03-05
- 右侧控制区 UI/UX 全面打磨：模块间距加大、标题统一弱化样式（11px/0.08em letter-spacing）
- Par 数字按钮改为金色（#D4A017）加粗，选中态保持绿色白字
- 球员按钮高度 32px，所有交互按钮统一圆角 6px + 80ms ease-out 动效
- 击球类型按钮右下角新增键盘快捷键角标（T/A/L/C/U/V），FOR 结果按钮角标（B/P/O）
- Final Score / Export 标题统一弱化（muted）
- 新增快捷键：T/A/L/C/U/V=击球类型，B/P/O=FOR 结果，↑/↓=上一洞/下一洞
- 新增 gotoPrevHole()，方向键 ↑/↓ 可循环切换球洞
- 快捷键在输入框（INPUT/TEXTAREA/SELECT）聚焦时自动屏蔽，Ctrl/Cmd/Alt 修饰键时不触发

### v6.3.2 — 2026-03-05
- 修复 F9/B9/18H 切换无效：radio onChange 增加 `S.scorecardSummary=null`，清除统计卡优先状态，确保 Scorecard Overlay 立即更新
- 右侧面板宽度减少 15px（355→340px）
- 击球类型按钮字号减小（9→7px），padding/高度缩减（28px→24px）

### v6.3.1 — 2026-03-05
- 修复 F9/B9 Scorecard 范围切换无效：getSCRange() 未读取 S.scoreRange，现已修复
- Players/Manage 恢复同行显示（标签左、按钮右对齐）
- 杆进度色块和 PREV/NEXT 按钮缩小（高度 26px）
- 击球类型按钮缩小（min-height 28px，字号 9px）
- 球员按钮显示序号"1 Pack"，键盘 1–9 快速切换对应球员

### v6.3.0 — 2026-03-05
- Par 按钮组加 "Par" 标签；右侧面板宽度 340→355px
- PREV/NEXT 改为循环（首杆↔末杆），删除 "SHOT" 文字
- 杆进度 "4/5" 改为可点击的色块数字按钮（当前/已完成/未来 3 种状态）
- 删除导出区 Single/Batch 标签（仅保留按钮）
- Scorecard 范围选项改为与 SC 开关同行 inline 显示（F9/B9/18H）
- Players 区域："管理..." 按钮移至球员列表下方
- Course Name 输入框宽度缩短

### v6.2.0 — 2026-03-05
- 右侧面板重构：Par 3/4/5 按钮移入洞号标题行；Players 区域移至洞号下方；To Pin 距离移入 Shot 区域；Total Display 开关移至预览区工具栏（16:9 按钮左侧）
- 新增击球类型 P（暂定球 Provisional），支持全语言
- Shot Overlay 球员名字字号 32→34px
- 总杆显示逻辑：过程态（TEE/APPR等）只计前 N-1 洞；结果态（PAR/BIRDIE/BOGEY）计入当前洞
- Scorecard 范围选项移至工具栏上方，展开时向上，避免界面跳动
- 导出区：删除提示文字；Single 改为框线按钮，Batch 改为绿色实体按钮；标签字号与 Shot/Final Score 一致

### v6.1.0 — 2026-03-05
- B1: 球员区添加"Players:/球员："标签 + "Manage…/管理…"按钮，移除旧 Players… 占位文字
- B2/B3: 导出区重组为 Single / Batch 两行，增加提示文字"Export: Overlay only"
- B4: 移除 ptool 区球员姓名输入框（与多球员系统冲突），相关 JS null-safe 处理
- B5: Final Score 数字字体 54→56px 加大
- B6: PREV/NEXT 击球按钮字体 13→11px 缩小
- B7: 击球信息版左栏洞号/PAR/标准杆 Y 坐标下移（0.28/0.53/0.76 → 0.31/0.57/0.80）
- C3: 球员管理历史列表增加搜索框，实时过滤历史球员

### v6.0.1 — 2026-03-05
- A1: 修复默认背景图启动不显示（onerror 在 src 赋值前绑定，display:block 立即生效）
- A2: Score Board 范围选项移至左侧预览下方，紧贴 SC 开关，消除遮挡与定位错误
- A3: TOT 统计始终为 Gross，覆盖全部 18 洞（未填写洞按 Par 计入），不受 To Par 模式影响
- A4: 开球（Shot 0）距离改为全球员共享的洞长度，任何球员修改后所有人同步
- A5: 点击 OUT/IN/TOT 统计卡高亮（stat-active），与洞号卡行为一致；New Round 同时清空已选球员
- 修复球员全名显示被误加省略号（与 S.playerName 对比改为与原始名对比）

### v6.0.0 — 2026-03-04
- 多球员系统：支持最多150名球员，session 单人模式无缝启动；首次添加球员自动迁移已录数据
- 球员操作区：位于距旗杆输入与击球类型之间，每行最多4个按钮，当前球员高亮；球员管理入口（Players…）含历史球员库
- Tee Off 洞长度共享：同洞第一杆距离所有球员共享
- 导出系统全面解耦：Shot PNG / SC PNG 独立导出；Hole Sequence / SC Sequence 批量导出为 ZIP（使用 JSZip）
- 文件命名规则：`{Course}_{Player}_H{n}_S{n}_{TYPE}_{MODE}_{RES}.png` 等
- Scorecard TOT 列永远显示 Gross 总杆
- 计分卡左上角可选显示球员名字（⚙️ Settings 开关）
- 击球信息版开关 / 计分卡开关移至预览区下方与球场名称同行

### v5.5.0 — 2026-03-04
- 新增多语言支持：日文（🇯🇵 日本語）、韩文（🇰🇷 한국어）、西班牙语（🇪🇸 ES）
- UI 术语、成绩选择器、Canvas 文字、系统提示全面本地化

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
