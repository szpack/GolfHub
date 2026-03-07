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

### v10.16.0 — 2026-03-07
- 重构右侧 Hole/Shot 控制区 UI 布局
- Hole 信息区：HOLE N 独立行 + PAR | TO PIN 第二行
- 新增 Hole Score 显示行（杆数 + to par + 名称）
- Shot 进度条下方新增 TO PAR 对齐行，每杆累计差值
- 洞导航移至底部，中间显示球场名
- 移除 Course 独立区域，整合至底部导航栏

### v10.15.1 — 2026-03-07
- 取消 Shot Type / Purpose / Result 的自动推断高亮，点什么显示什么，纯手动模式

### v10.15.0 — 2026-03-07
- 重构Shot状态录入逻辑：Shot Type支持连续录入模式（下一杆准备态，黄色描边）
- Purpose/Result/Flags/Note始终只修改当前杆，并自动取消准备态
- 进度条新增ready状态（黄色描边），点击进度条/←→/切洞/切球员均取消准备态
- 当前杆改为黄色填充背景（与准备态黄色描边区分）
- 删除所有3PUTT相关逻辑（UI显示和Canvas badge）

### v10.14.1 — 2026-03-07
- HOLE X上方留白减少
- RESULT落点区按钮支持自动换行显示

### v10.14.0 — 2026-03-07
- RESULT区改名为PURPOSE（目标），保留FOR BIRDIE/FOR PAR/FOR BOGEY
- 新增RESULT（结果/落点）区：上果岭、上球道、下沙、二级草、三级草、下水、进树林
- 落点数据存储在每杆的`landing`字段，支持点击切换和自动跳下一杆

### v10.13.5 — 2026-03-07
- 计分卡导航区点击PAR/HOLE只切换洞号，不再弹出成绩编辑器
- Score区"…"改为"编辑"按钮（多语言），点击打开成绩编辑器

### v10.13.4 — 2026-03-07
- 点击Shot Type/Result/Flag按钮后自动跳到下一杆，支持快速连续编辑

### v10.13.3 — 2026-03-07
- 手动设置Shot Type后，自动推断的Result（如FOR PAR）不再高亮，Canvas也优先显示手动Shot Type

### v10.13.2 — 2026-03-07
- Shot Type和Result按钮统一使用实心黄底高亮，不再区分手动/自动推断的淡黄色样式

### v10.13.1 — 2026-03-07
- 点击Score按钮后不再自动选中第一杆，进入总览模式（显示整洞得分而非某一杆过程）
- 总览模式下Shot Type/Result按钮不选中任何项
- 通过点击杆号按钮或prev/next可进入具体某一杆

### v10.13.0 — 2026-03-07
- 重构击球推断引擎：基于模板的shot type自动推断（Par 3/4/5 × 各种gross组合）
- 修复黄色高亮优先级：同一时刻仅一个按钮组显示auto-active（RESULT优先于SHOT TYPE）
- 3PUTT改为洞级摘要标签，不再覆盖逐杆shot type/result显示
- 新增FOR DOUBLE / FOR TRIPLE自动推断（delta +2/+3时倒数第二杆）
- Canvas击球信息版增加3PUTT小标签（红色，进度条左侧）
- 修复birdie及更优成绩时错误显示双推杆模板（改为单推杆）

### v10.12.0 — 2026-03-07
- 计分卡导航区：点击PAR/HOLE列打开成绩编辑抽屉；成绩数字字号加大
- 导出弹窗：按钮改为并排布局，每个按钮上方添加功能说明
- 击球信息版(Canvas)：球员名字字号加大（34→38px）
- 球员选择器：字体字号与主界面统一(Roboto)，关闭后刷新所有相关区域
- 计分卡信息版(Canvas)：第一列名字加宽10px
- 右侧所有按钮添加明显hover态（背景+颜色+边框变化）
- 左侧布局：预览区+计分卡自上而下铺设（预览区不再flex:1撑满）
- Desktop/iPad窄屏时(≤480px)自动切换移动端适配模式
- HOLE区：去掉整行hover，Players/Hole分隔线改为短divider
- Shot导航箭头高度与进度条按钮对齐(26px)
- TRIPLE+去掉+号，统一为TRIPLE
- 修复PUTT按钮换行BUG(sp-btn-row改为nowrap)
- 点击成绩按钮后Shot进度条回到第1杆（不选中最后一杆）
- Settings外观默认改为Auto

### v10.11.1 — 2026-03-07
- 右侧面板布局调整：球场 → 球员 → 洞号（Hole行独立为单独区块）

### v10.11.0 — 2026-03-07
- 新增自动击球推断系统 (Shot Inference Engine)
  - 自动推断 SHOT TYPE: TEE → APPR/LAYUP → PUTT（基于洞Par、成绩、杆号）
  - 自动推断 RESULT: FOR BIRDIE / FOR PAR / FOR BOGEY（倒数第二杆）
  - 自动检测 MULTI-PUTT: 3PUTT / 4PUTT 等
  - 显示优先级: customStatus > result > shotType
  - 支持手动覆盖 (manual override)，effective = manual ?? auto
  - 自动推断按钮以半透明金色高亮 (auto-active)，手动选择为实色金色 (active)
  - FLAGS (PENALTY/PROVISIONAL) 仅支持手动设置

### v10.10.3 — 2026-03-07
- SHOT区：移除To Pin标签，码数输入移至SHOT标题后方
- SHOT区：上/下一杆按钮改为← →箭头，尺寸加大（36×30px）

### v10.10.2 — 2026-03-07
- 修复移动端页面自动跳动：禁用移动端To Pin自动聚焦、移除距离输入scrollIntoView、导航滚动改用scrollTo避免垂直跳动

### v10.10.1 — 2026-03-07
- Player Name 和 Total 显示默认开启

### v10.10.0 — 2026-03-07
- NEXT按钮加长，提升点击体验
- 移动端标题区恢复版本号与邮箱显示（小字）
- 移动端移除SKIN、Preview、Options按钮，简化界面
- 修复移动端页面滚动到底端弹回顶部的bug（overscroll-behavior）
- 球场名称编辑改用自定义弹窗，解决系统prompt被浏览器拦截的问题
- 移动端全局字号增大，提升可读性
- 计分卡导航区左右滑动时锁定第一栏（球员名字sticky）
- 修复数据持久化丢失问题：页面刷新不再强制重置当前洞和球员，添加beforeunload/visibilitychange即时保存

### v10.9.5 — 2026-03-07
- 修复计分卡列hover闪烁(grid gap问题)：鼠标经过格子间隙时保持当前高亮不变

### v10.9.4 — 2026-03-07
- 修复计分卡PAR/HOLE列hover闪烁：改用mouseover+列号跟踪，同列内移动不触发DOM操作

### v10.9.3 — 2026-03-07
- 计分卡导航：PAR行和HOLE行同一列的格子作为整体，hover时两个格子同时高亮，点击统一切换到该洞
- PAR行当前洞也显示sg-active高亮（与HOLE行一致）

### v10.9.2 — 2026-03-07
- 修复9:16竖屏比例下击球信息版超出右边界：默认x从0.695调整为0.542

### v10.9.1 — 2026-03-07
- 设置抽屉视觉对齐主界面：统一Roboto字体、11px标题/12px正文、6px间距、6px圆角
- 设置区块改用panel-border分隔线(与右侧面板一致)
- 按钮高度从36px→30px、ratio/res按钮从32px→28px，更紧凑
- 设置头部、关闭按钮、新一轮弹窗同步调整

### v10.9.0 — 2026-03-07
- 计分卡导航：HOLE X + Par X 行增加hover整体高亮反馈
- Score区中文版本地化：小鸟/帕/柏忌/双柏忌/三柏忌（不再显示英文Birdie/Par等）
- 击球类型区中文本地化：开球/攻果岭/过渡/切杆/推杆（不再显示TEE/APPR等）
- 切换画面比例时自动重置击球信息版和计分卡位置到默认位置

### v10.8.0 — 2026-03-07
- 多语言翻译彻底完善：新增40+翻译key，消除全部英文硬编码
- 设置抽屉完整翻译：外观/深色/浅色/自动、角标样式名、安全区选项、上传背景、重置Par按钮
- 移动端完整翻译：+击球/完成本洞/撤销/预览/导出/重置/返回，距离输入placeholder
- 计分抽屉标题翻译：中文"第X洞·标准杆Y"，日文"ホールX·パーY"等
- Score Drawer底部按钮不再硬编码中文，走翻译系统
- 移动端总杆显示、Par标签、Options按钮全部走T()翻译
- To Pin标签、Note placeholder、球场输入placeholder全部翻译
- 默认球员名走翻译（中文"球员"、日文"プレーヤー"等）

### v10.7.0 — 2026-03-07
- 多语言全面完善：新增30+翻译key，覆盖UI标签、错误提示、导出弹窗、球员管理等
- 消除所有JS中的硬编码 `LANG==='zh'` 三元判断，统一使用 `T()` 翻译函数
- 修复中文 layup 错字："过度" → "过渡"
- 5语言(en/zh/ja/ko/es)完整对齐：右侧面板标签、Shot分组标题、导出按钮文字、提示消息
- 右侧面板所有标签加 ID 支持动态翻译（Course/Score/Shot Type/Result/Flags/Note/Export/PREV/NEXT）
- Logo 文字走翻译系统（中文显示"高尔夫角标助手"，其他语言显示"GOLF OVERLAY"）

### v10.6.1 — 2026-03-07
- Score按钮样式统一：与球员名按钮同尺寸(28px/11px)，全部大写，等宽flex布局

### v10.6.0 — 2026-03-07
- 导出区收纳为蓝色"Export…"按钮，点击弹出模态框(Single/Batch/All分组)
- Shot Type按钮标签简化：TEE OFF | APPR | LAYUP | CHIP | PUTT，一行排列

### v10.5.0 — 2026-03-07
- Shot状态面板重构：分为SHOT(导航)、SHOT TYPE(TEE OFF/APPROACH/LAYUP/CHIP/PUTT)、RESULT(FOR BIRDIE/PAR/BOGEY)、FLAGS(PENALTY/PROVISIONAL)四组
- 新增NOTE临时录入区，可输入简短信息显示在Canvas角标状态区
- 统一按钮样式：深色背景(#2a2f35)、6px圆角、黄色高亮active状态
- 各组间距16px，按钮间距6px，标题12px灰色大写
- Shot导航恢复"<"和">"双向按钮

### v10.4.2 — 2026-03-07
- Shot进度条：按钮加大加粗(26px/12px bold)，间距加大，单行不换行显示
- 程序启动默认选中第一个球员、第一个球洞

### v10.4.1 — 2026-03-07
- Shot进度条：未录入成绩时默认展示par个按钮(disabled状态)，录入成绩后按钮可点击

### v10.4.0 — 2026-03-07
- 计分卡：PAR行和HOLE行交换顺序(PAR在上，HOLE在下)
- 计分卡：选中格子(当前洞+当前球员)使用黄底实色(#FFD700)，与球员名高亮一致
- 右侧：EDIT按钮移至Course标签行右对齐；球场名加大至15px；HOLE X加大至18px
- 右侧：Score区"…"按钮移至标签行右对齐；Score与Shot之间增加分隔线
- 右侧：Shot进度条仅保留">"按钮(移除"<")

### v10.3.0 — 2026-03-07
- 右侧面板三区布局：球场球洞区(Course标签→球场名+EDIT→HOLE X Par X Prev/Next)
- 本洞状态区：Score标签→成绩快捷按钮(Birdie~Triple+/…)→Shot标签+To Pin→击球进度条+</>导航→状态标签(白底选中态)
- 导出区：Single/Batch/All分组，每行按钮+简要功能说明文字，统一outlined风格
- 击球类型按钮选中态改为白底突出(dark)或深底白字(light)
- 移除>>(shot next)按钮，改为</>双向导航，>按钮加宽作为主操作

### v10.2.0 — 2026-03-07
- 右侧面板重构：球场名与HOLE信息合并为统一区域，HOLE/数字同字号粗体
- Players区：标签行(Players + EDIT) + 4个固定槽位球员按钮，点击不重排，新球员替换首位
- Shot区重组：Shot标签行含To Pin距离；成绩快捷按钮(Eagle~Triple+)；进度条；击球类型分三行(状态/推杆/罚杆)；自定义状态输入
- Export区：所有按钮统一outlined风格，移除绿底batch按钮
- 计分卡导航：简化hover为单格黄色高亮，移除列级联hover；HOLE/PAR行hover黄底

### v10.1.0 — 2026-03-07
- 焦点区重构：HOLE行显示HOLE X + Par X(点击循环3/4/5) + PREV/NEXT按钮
- 焦点区新增球员快捷切换行：显示4个最近操作球员按钮，黄底高亮当前球员
- 计分卡导航区：点击HOLE/PAR行打开成绩录入弹窗，点击球员格子仅切换洞和球员
- 计分卡导航区：球员格子hover显示黄底，当前选中格子黄底高亮

### v10.0.0 — 2026-03-06
- 右侧面板完全重构：球场名→焦点区(HOLE+球员)→击球进度→击球信息→洞导航→导出
- 新增 PENALTY 击球类型
- 导出区重组为 Single / Batch / All 三组，新增"All Players × All Holes"全量导出
- 球场名显示移至右侧面板顶部，支持点击 Edit 修改
- 新增 ◀ PREV / NEXT ▶ 洞导航按钮
- 修复 btn-prev 移除后 wireAll() 崩溃问题

### v9.9.5 — 2026-03-06
- 右侧面板全局统一 Roboto 字体，与左侧计分卡导航区对齐
- HOLE 标签改为 12px 大写粗体，洞号 32px，Par 标签 12px 粗体
- 段标题 .stitle 统一 Roboto 12px/700 大写
- 击球按钮、导出按钮、距离标签等全部切换 Roboto 字体

### v9.9.4 — 2026-03-06
- 成绩编辑器改为屏幕居中显示，缩放淡入动画
- 宽高比对调为 φ:1 横向（369×228px），名字区域更宽
- OK 按钮右下角，清空按钮靠左独立分区

### v9.9.3 — 2026-03-06
- 成绩抽屉宽高比调整为黄金分割 1:φ（228×369px），内部间距加大
- 三按钮采用 Fibonacci 比例 2:3:5（清空:取消:确定），确定按钮最宽最醒目
- 按钮高度加大到 30px，行高 32px，整体更舒展

### v9.9.2 — 2026-03-06
- 成绩抽屉底部新增三按钮：清空（红）、取消、确定（绿色着重）
- 未录入成绩的洞默认显示 Par(0) 蓝底，确定时自动提交为 Par
- Delta 滚轮字体改为 Roboto 12px 粗体，与计分卡网格风格一致

### v9.9.1 — 2026-03-06
- 右侧面板底部新增球场名称行：显示当前球场名或"（未设置球场）"，可点 Edit 修改
- 移除 Canvas 计分卡上的球场名字绘制及点击编辑功能

### v9.9.0 — 2026-03-06
- 移除右侧面板球员成绩录入模块（已由计分卡抽屉替代）
- 计分卡导航区当前球员名字黄底黑字高亮（与球洞高亮风格一致）
- 点击球员名字切换当前球员

### v9.8.1 — 2026-03-06
- 成绩录入抽屉改为小方盒子，跟随点击位置弹出
- 字体字号统一为计分卡网格风格（Roboto 11-12px）
- Delta 色块可点击打开成绩滚轮，默认滚到 Par；关闭时未选值则保留原值，原值为空则自动设为 Par

### v9.8.0 — 2026-03-06
- 新增成绩录入抽屉：点击计分卡导航区球员杆数区域，弹出底部抽屉快速录入该洞所有球员成绩
- 抽屉显示该洞号 + Par，每行一个球员：名字、−、delta 色块、+
- 支持跨洞录入（不限于当前洞）

### v9.7.3 — 2026-03-06
- 浅色模式下 logo 可读性修复：GOLF 改为深金色、OVERLAY 改为深色文字

### v9.7.2 — 2026-03-06
- 计分卡导航区 PAR 值统一为 12px/700 粗体，与 HOLE 表头和球员杆数一致

### v9.7.1 — 2026-03-06
- 计分卡导航区球员杆数字号增大 2px（10→12，narrow 模式 8→10）

### v9.7.0 — 2026-03-06
- 计分卡导航区全面重设计：PGA TOUR 风格
- 引入 Roboto 字体，统一计分卡网格排版
- 表头行：深绿底(#1B5E3B)、12px 粗体大写，当前洞金色高亮
- PAR 行/球员名：11px，球员名加粗 500/700
- 杆数数字：10px 粗体，恢复清晰可读
- 浅色模式：表头保持深绿白字，统一专业观感
- 悬停交互：内阴影边框反馈 + 按下缩放效果
- 行高/间距优化，提升整体扫描可读性

### v9.6.6 — 2026-03-06
- 浅色模式下 HOLE X 区域可读性优化：深色文字、Par 按钮/标签适配浅色背景

### v9.6.5 — 2026-03-06
- 计分卡导航区杆数字号减小 2px（10→8，narrow 模式 9→7）

### v9.6.4 — 2026-03-06
- 计分卡导航区 TOT 列始终显示 Gross 总杆数（不受 displayMode 影响）
- PAR 行底色与 HOLE 行一致（深色背景），文字半透明区分层次

### v9.6.3 — 2026-03-06
- 计分卡导航区成绩显示跟随 Settings 中 To Par / Gross 设定，包括每洞、OUT/IN 小计和 TOT 总计

### v9.6.2 — 2026-03-06
- Fix: 计分卡 Canvas 覆盖层成绩显示范围修正为 1~N（含当前洞），之前 scoreEnd 用的是 currentHole 而非 currentHole+1

### v9.6.1 — 2026-03-06
- 计分卡 Total badge 始终显示第1洞到当前洞（含）的累计成绩，不再区分 in-play/result 模式

### v9.6.0 — 2026-03-06
- Apple Design 风格全局字体系统重构
- 建立 6 级字号阶梯（9/10/11/13/22/36px），统一 4 级字重（400/500/600/700）
- 启用 -webkit-font-smoothing: antialiased 亚像素渲染
- 大写标签统一 letter-spacing（.08–.12em），提升呼吸感
- HOLE label 改为轻量 300 字重，与粗体洞号形成层次对比
- 全局圆角统一为 6/8px，间距微调更均匀
- 去除冗余 font-weight: 800/900，按钮/标签风格更克制

### v9.5.4 — 2026-03-06
- 右侧球员区当前选中球员整行绿色色块高亮，一眼识别当前操作球员

### v9.5.3 — 2026-03-06
- **Bug Fix**: 修复关闭浏览器后当前球员成绩丢失的问题（doSave 前未同步 S.holes→byPlayer）

### v9.5.2 — 2026-03-06
- PGA 计分卡列 hover 高亮：鼠标悬停时整列背景变亮
- 当前洞整列高亮（header/par/成绩行统一 sg-col-active 背景）
- 点击球员成绩格同时切换球员和球洞，右侧面板联动更新

### v9.5.1 — 2026-03-06
- PGA 计分卡名字列加宽（60→80px），球员名字缩小不突兀
- 成绩装饰统一单色（去掉彩色），+3及以上用三层方框表示

### v9.5.0 — 2026-03-06
- PGA TOUR 风格计分卡导航表格：HOLE/PAR/球员成绩网格布局
- PGA 成绩装饰：Eagle 双圈、Birdie 圆圈、Bogey 方框、Double 双框、Triple+ 填充
- 点击洞号切换当前洞，点击球员名称切换当前球员
- 当前洞列高亮、当前球员行高亮
- OUT/IN/TOT 小计列，点击可切换计分卡汇总视图
- 移动端窄屏适配 PGA 网格压缩布局

### v9.4.3 — 2026-03-06
- Scorecard 默认勾选显示（showScore 初始值改为 true）

### v9.4.2 — 2026-03-06
- Fix: 添加缺失的 expModeLabel() 函数，修复 18 SC ZIP 导出报错

### v9.4.1 — 2026-03-06
- 击球类型按钮 flex:1 均分行宽、nowrap 禁止换行、字号 10px、padding 缩减，确保 FOR BIRDIE/FOR PAR/FOR BOGEY 单行显示

### v9.4.0 — 2026-03-06
- 击球类型全称：TEE OFF / APPROACH / PROVISIONAL，重排为三行布局
- 杆数进度条改为 24×24 正方形，压缩横向空间
- HOLE 区 gap 16→10px，去掉 Par col 左边距，NEXT 去掉箭头
- Par 选中态改为白底黑字（与杆数进度条 .cur 一致）

### v9.3.8 — 2026-03-06
- TO PIN 标签改用 .stitle 样式，与 EVERY SHOT 同级大小
- PREV/NEXT 按钮去掉英文仅保留箭头 ◀ ▶，宽度 58→30px
- 右侧面板宽度 340→300px，整体更紧凑

### v9.3.7 — 2026-03-06
- EVERY SHOT 标题改用 .stitle 样式，与 PLAYERS/EXPORT 统一
- To Pin 标签和 yds 改用 .tbtn 样式，与 TEE/APPR 等按钮统一
- 击球区各行间距加大（dist-row mb 10px, shot-nav mb 8px, type-row1 mb 5px）

### v9.3.6 — 2026-03-06
- Fix: 计分卡拖动失灵 — getSCDrawX 未正确转换 center-x 为左边缘，命中区域偏移半个宽度
- 计分卡"球场名字"区域鼠标光标改为 text（I-beam），其余区域保持 move

### v9.3.5 — 2026-03-06
- Fix: 安全区磁吸仅在 Safe Zone 开启时生效，关闭时击球信息版可自由拖动
- 画布边缘轻磁吸（6px），拖动范围放宽至仅需保留 10px 可见
- Fix: 初始化渲染延迟至 requestAnimationFrame，防止信息版位置跳动

### v9.3.4 — 2026-03-06
- Fix: applyLang 中按钮文字从 "Manage…" 改为 "EDIT"（多语言：编辑/編集/편집/EDITAR）

### v9.3.3 — 2026-03-06
- Manage… 改为 Edit
- 球员行布局：名字占 50%，delta 控件（− 杆数 +）占 50% 居中排列
- Delta 数字加粗 800/15px，±按钮加大 18px/30×32
- PLAYERS 标题与球员列表之间增加分隔线

### v9.3.2 — 2026-03-06
- HOLE/洞号恢复上下两行布局（HOLE 28px + 洞号 36px）
- Par 按钮字号 22→20px，按钮尺寸 40×36→38×34

### v9.3.1 — 2026-03-06
- HOLE 标签改为 28px（比洞号 36px 小一号），同行 baseline 对齐

### v9.3.0 — 2026-03-06
- HOLE X 拆分为两行：HOLE 标签 12px + 洞号 36px，视觉层次更清晰
- Par 按钮未选中改为透明背景（融入 banner），选中改为 accent-green 绿底白字
- 多语言 holeLbl 支持（中文"第·洞"、西语"HOYO"等）

### v9.2.8 — 2026-03-06
- Par 按钮字号强制 22px/900 weight（!important 防止被通用 .par-btn font 简写覆盖）
- 按钮尺寸微调 40×36px 配合更大字号

### v9.2.7 — 2026-03-06
- Par 按钮字号 18→20px 加粗加大
- Par 区域增加 margin-left:8px，与 HOLE 拉开间距
- Par 区域 flex:1 填充中间空间，NEXT 自然靠右，三区域排列协调

### v9.2.6 — 2026-03-06
- HOLE 字号 36→34px，底部对齐（align-items:flex-end）
- Par 按钮、NEXT 按钮与 HOLE 数字下方水平对齐，NEXT 高度匹配 34px
- hero 区 gap 增至 16px，元素间距更宽松

### v9.2.5 — 2026-03-06
- HOLE 数字居中显示（min-width:60px, text-align:center）
- Par 按钮加大至 38×34px / 18px 字号，选中白底金字，未选中黑底金字
- Par 按钮间距从 3px 增至 6px，hero 区整体 gap 从 10px 增至 14px

### v9.2.4 — 2026-03-06
- Par 3/4/5 按钮改为白底金字（#FFD700），选中时仍为绿底白字
- NEXT 按钮改为绿底白字（#4CAF50），按压加深

### v9.2.3 — 2026-03-06
- To Par / Gross 显示模式按钮从左侧导航区移入 Settings 抽屉 Overlay 分组

### v9.2.2 — 2026-03-06
- "EVERY SHOT" 改为全大写，与 "To Pin" 同行显示，中间弹性留空

### v9.2.1 — 2026-03-06
- Shot 区块顶部新增 "Every Shot" 标题（多语言），字体 13px 加粗突出

### v9.2.0 — 2026-03-06
- 击球类型按钮（TEE OFF/PUTT/FOR PAR 等）改为球员名字按钮风格：无边框、文字高亮
- Export 区两个绿色批量导出按钮统一宽度

### v9.1.3 — 2026-03-06
- 移除右侧面板 "Shot" 区块标题和 Export 区的 "Shots"/"Scorecard" 分组标签，界面更简洁

### v9.1.2 — 2026-03-06
- Fix: picker 弹出位置改为点击坐标处，避免 DOM 重建导致定位偏移

### v9.1.1 — 2026-03-06
- Fix: 杆数选择 picker 定位改为基于点击元素，不再依赖已移除的 delta-val-btn
- TEE SHOT 改为 TEE OFF

### v9.1.0 — 2026-03-06
- 右侧面板重构：Hole+Par 改为上下结构，新增顶部 NEXT 按钮
- 球员区每人一行，内联 ±/成绩操作按钮，可直接录入每位球员的当前洞杆数
- 移除 Final Score 独立区块
- Export 区样式优化：标签更小，单张导出按钮缩小，批量按钮突出
- 批量导出升级：导出当前洞所有球员的完整数据包（ZIP）

### v9.0.0 — 2026-03-06
- 新增界面浅色主题，Settings 中切换 Dark / Light / Auto（跟随系统）
- 默认深色，浅色主题覆盖所有 CSS 变量及特殊组件样式

### v8.5.3 — 2026-03-06
- 点击计分卡名字行右侧球场名区域可弹出输入框修改球场名

### v8.5.2 — 2026-03-06
- Fix: 计分卡球场名颜色从白色半透明改为深灰半透明，在浅色背景上可见

### v8.5.1 — 2026-03-06
- Fix: 计分卡名字行始终显示（不再依赖 Show Player Name 开关），球场名始终可见
- Fix: 名字行区域纳入拖拽检测范围，支持鼠标拖拽

### v8.5.0 — 2026-03-06
- 计分卡球员名字行右侧显示球场名（灰色小字），未填写时默认显示 szpack@qq.com

### v8.4.4 — 2026-03-06
- Canvas 进度条：当前杆之后至标准杆的格子改为与已打杆一致的填充样式

### v8.4.3 — 2026-03-06
- 球洞导航区紧贴预览区，去除分隔线和多余间距

### v8.4.2 — 2026-03-06
- 球场名称输入框移入 Settings 抽屉（Course 区），主界面移除 ptool 栏

### v8.4.1 — 2026-03-05
- 移除计分卡导航区左侧的 Overlay Style 换肤按钮（已在 Settings 中）

### v8.4.0 — 2026-03-05
- 多语言切换改为下拉菜单：仅显示当前语言按钮，点击展开所有语言选项
- 移除旧的多按钮横排布局和窄屏循环切换按钮
- 点击菜单外自动关闭

### v8.3.1 — 2026-03-05
- 移除 Shot 标题旁的 MANUAL/AUTO 标签

### v8.3.0 — 2026-03-05
- 界面精简：Shot/SC/F9/B9/18H/Player/Total开关、比例、分辨率、透明度全部移入Settings抽屉
- 主界面仅保留课程名输入框，外观更干净
- Export区仅保留导出按钮和进度条

### v8.2.2 — 2026-03-05
- Canvas 击球信息版进度条优化：只显示到当前杆，不足标准杆则补描边空心格至 Par 数

### v8.2.1 — 2026-03-05
- Fix: 进度条格数恢复为 max(gross, par)，所有实际杆可点击，仅标准杆多出的空位为描边空心

### v8.2.0 — 2026-03-05
- 进度条重构：显示格数 = max(当前杆, Par)，当前杆之后的格子用描边空心显示
- 取消数字键 1-9 切换球员快捷键
- 球员按钮不再显示序号前缀
- 点击 PREV/NEXT 杆或杆号按钮后自动聚焦 To Pin 输入框

### v8.1.0 — 2026-03-05
- 击球进度条始终显示至少 Par 数量的格子（如 Par4 固定显示4格）
- 低于标准杆时（鸟/鹰），未使用的杆位以描边空心样式显示
- Canvas 覆盖层和右侧面板杆号按钮同步适配

### v8.0.3 — 2026-03-05
- 切换球洞时（键盘左右键、点击导航卡片）所有玩家的当前杆均重置为第一杆
- 统一四处切换入口（gotoNextHole / gotoPrevHole / buildHoleNav / mob导航）

### v8.0.2 — 2026-03-05
- Fix: replace CSS `@media(max-width)` with JS `screen.width` detection + `html.narrow` class
- Immune to Safari "Request Desktop Website" mode which inflates viewport to ~980px
- Detection script runs in `<head>` before first paint, no layout flash

### v8.0.1 — 2026-03-05
- Fix: iPhone narrow-screen breakpoint widened from 430px to 480px (iPhone 16 Pro Max viewport is 440px, was not triggering)

### v8.0.0 — 2026-03-05
- iPhone narrow-screen adaptation (≤430px): responsive compression of existing desktop layout
- Breakpoint changed from 768px to 430px — no longer triggers on tablets/iPads
- Header: one compact line with product name, language cycle button, Skin, gear, New
- Hole nav: single-row horizontal scroll with fade hints, auto-scroll to active hole
- Theme picker hidden from nav on narrow; accessible via Settings drawer (Overlay Style section)
- Options bar with Preview + Options toggle between canvas and hole nav
- All right-panel sections (Par, Players, Shot, Final Score, Export) compacted with reduced padding
- Type buttons become horizontal scrollable row on narrow
- Preview entry opens fullscreen preview overlay for adjusting overlay positions

### v7.1.0 — 2026-03-05
- Mobile layout rework: fix capsule button truncation with proper horizontal scroll padding + fade masks
- Remove player section from mobile body (use More → Players instead) to eliminate blank space
- Convert F9/B9/TOT scorecard summary from card layout to compact inline text
- Reduce bottom bar height (44px buttons, tighter padding)
- Shrink hole nav buttons and add fade gradient scroll hints
- Add long-press repeat for distance +/- buttons
- Add scrollIntoView when distance input receives focus (prevents keyboard obstruction)
- Reduce vertical spacing throughout all mobile sections

### v7.0.0 — 2026-03-05
- 新增 iPhone 移动端 Record Mode（<=768px 自动切换）
- 固定顶部 Header：HOLE X · Par X · To Pin 距离（点击 Par 可循环切换 3/4/5）
- 击球状态胶囊按钮（横向滚动）：TEE/APPR/LAYUP/CHIP/PUTT + FW/Rough/Bunker/Trees/Water/OB/Drop/Green
- To Pin 距离快速微调按钮（-5/-1/+1/+5）
- 本洞结果区：点击展开编辑，支持 +/- 调整和快捷标签选择（Albatross~+3+）
- 计分卡区简化为 F9/B9/TOT 摘要卡片
- 18 洞横向滚动导航，当前洞高亮并自动居中
- 左右滑动手势切洞（左滑下一洞、右滑上一洞）
- 固定底部操作栏：+Stroke / Finish Hole / Undo（避免遮挡内容，键盘弹出时自动隐藏）
- More 菜单（底部 Action Sheet）：Preview / Export PNG / Settings / Players / Reset Hole
- Preview 页面：显示背景图 + Canvas 角标，支持拖动调整位置并导出
- 球员按钮行在移动端支持横向滚动

### v6.7.4 — 2026-03-05
- 为 CSS/JS 链接添加版本查询参数（?v=6.7.4），解决 GitHub Pages CDN 缓存旧样式导致布局不一致的问题

### v6.7.3 — 2026-03-05
- Overlay Style 主题切换按钮移至计分卡导航区左侧，改为竖排列，右侧 border 分隔；hole cards 导航区居中显示

### v6.7.2 — 2026-03-05
- 新增 THEMES.livgolf：黑底霓虹风，绿色（#39ff14）发光边框/分隔线/Par/距离值，紫色 Eagle，红色 Bogey
- drawPanelFrame 新增 glow 分支：border 描边前设置 shadowColor/shadowBlur，描边后立即 restore 清除 shadow

### v6.7.1 — 2026-03-05
- 新增 THEMES.pgatour：深海军蓝主色（#0a2a66）、红色强调（#e2231a，Par值/分隔线/得分）、白色面板、16px圆角

### v6.7.0 — 2026-03-05
- 新增 THEMES.broadcast_gold 主题：金边双层边框、顶部高光、金色分隔线、金色 Par 值、较大圆角
- 新增 drawPanelFrame() helper：统一处理 Shot/Scorecard Overlay 的外框/背景/阴影/clip；goldFrame=true 时渲染双层金边+顶部高光；classic 保持原样
- 切换"Broadcast Gold"后两个 overlay 同步换皮，导出 PNG/ZIP 使用当前主题

### v6.6.1 — 2026-03-05
- 左侧 nav 区顶部新增「Overlay Style」皮肤切换面板（4个按钮：Classic / Broadcast Gold / PGA Tour / LIV Golf）
- 选中项高亮（绿色边框 + 粗体），单选行为，切换立即渲染并持久化 S.theme
- 非 classic 主题 fallback 到 classic 渲染，页面不崩溃

### v6.6.0 — 2026-03-05
- 引入 Theme 系统：新增全局 `THEMES` 常量 + `getTheme()` + `S.theme`（默认 `classic`）
- Shot Overlay 与 Scorecard Overlay 所有颜色/字号/圆角/阴影/分隔线均从 theme token 读取，消除硬编码
- `deltaColorHex()` 改为读取 `getTheme().sc.scoreColors`，delta 配色可随主题切换
- 视觉效果与 v6.5.x 完全一致（classic 主题），导出逻辑不变

### v6.5.5 — 2026-03-05
- 导出文件名移除成绩模式字段（GROSS/TOPAR）
- 新格式：`{Course}_{Player}_H{Hole}_S{Shot}_{ShotType}_{Res}.png`
- 所有字段统一首字母大写其余小写（Xili, Tee, Appr, For_Birdie…）
- 适用于 Shot PNG / Hole ZIP / Scorecard PNG / SC ZIP

### v6.5.4 — 2026-03-05
- 计分卡球员名字改为独立 badge 样式：白底黑字，圆角，仅包裹文字宽度，badge 外无背景延伸

### v6.5.3 — 2026-03-05
- 计分卡球员名字色块改为白底黑字，行底色保持绿色（#1B5E3B）

### v6.5.2 — 2026-03-05
- 计分卡球员名字行底色改为紧包文字（名字宽度 + 1字符留白），不再拉通整行

### v6.5.1 — 2026-03-05
- 修复默认背景图对应关系：9:16→bkimg-9-16.jpg，1:1→bkimg-1-1.jpg（原错位）
- 计分卡球员名字改为独立行显示于 HOLE 行上方，字号与击球信息区一致（34px），深绿底色

### v6.5.0 — 2026-03-05
- 键盘快捷键调整：←/→ 切换前后洞，↑/↓ 切换前后杆（原逻辑相反）
- 计分卡左上角球员名字加大加粗（更突出显示）
- 左侧导航区 SC 开关旁新增「Player」复选框，可快速切换计分卡球员名字显示；与设置中的开关双向同步
- 导出文件名英文单词改为 Title Case；完成态文件名 FINAL 前加 Z 前缀（排序更清晰）
- 9:16 竖屏自动放大：计分卡覆盖层 ×1.35，击球覆盖层 ×1.6；导出图同步生效
- 切换比例自动切换默认背景：16:9→bkimg.jpeg，9:16→bkimg-1-1.jpg，1:1→bkimg-9-16.jpg

### v6.4.5 — 2026-03-05
- 修复 To Pin 距离输入框显示上下箭头（CSS 隐藏 spinner，所有浏览器兼容）

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
