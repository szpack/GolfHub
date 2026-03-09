# Golf Event Console — 项目说明

## 项目名称
Golf Event Console（原 GolfOverlay）

## 用途
高尔夫赛事管理与实时展示系统。以球局（Round）为核心，以玩法（Gameplay）为主线，以 Overlay 为差异化展示层。

### 三层架构
- **Management Layer** — Players / Teams / Clubs / Rounds
- **Round Workspace** — Scores / Gameplay / Shots
- **Overlay Engine** — Leaderboard / Player Tag / Scoreboard / Match Board

## 主要功能
- **计分卡**：18洞成绩总览，支持前9/后9/全场显示，含OUT/IN/TOT子统计
- **当前洞操作**：Par设置、Delta成绩录入、击球序号导航、距旗杆距离
- **总杆统计**：实时累计 To Par / Gross 双模式
- **UI角标显示**：Canvas实时渲染覆盖层，支持拖拽定位、缩放比例切换
- **导出**：支持4K/1440P/1080P分辨率PNG透明导出
- **双语**：中英文界面切换（EN / 中文）
- **数据持久化**：所有状态通过 localStorage 自动保存

## 项目结构

```
GolfOverlay/
├── index.html          # App Shell + Overlay Center（HTML骨架）
├── css/
│   ├── overlay.css     # Overlay Center 样式（不修改）
│   └── shell.css       # App Shell 样式（可收起Sidebar / Workspace / BottomNav / 页面）
├── data/
│   └── courses.json    # 球场数据库（静态JSON）
├── js/
│   ├── data.js         # v4.0 统一数据访问层（最先加载）
│   ├── roundTypes.js   # Round 类型定义（JSDoc only，无运行时代码）
│   ├── round.js        # Round 数据模型（纯函数，data.js 之后加载）
│   ├── courseDatabase.js # 球场数据管理层
│   ├── scoreboard.js   # 计分卡逻辑
│   ├── ui.js           # 界面操作
│   ├── roundManager.js # Round状态管理
│   ├── coursePicker.js # 球场选择器UI
│   ├── clubStore.js    # Club球会主数据CRUD + localStorage持久化
│   ├── newRoundService.js # New Round 创建服务（纯逻辑，无UI）
│   ├── sessionIO.js   # 球局JSON导入导出
│   ├── import/          # GolfLive成绩导入模块
│   │   ├── importTypes.js      # 导入类型定义（JSDoc）
│   │   ├── fileSniffer.js      # 文件格式识别
│   │   ├── golfliveParser.js   # GolfLive表解析器
│   │   ├── roundBuilder.js     # 导入数据→Round构建
│   │   └── importController.js # 导入流程控制+UI桥接
│   ├── shell/           # App Shell 框架（app.js 之后加载）
│   │   ├── router.js        # Hash-based SPA 路由器
│   │   ├── shell.js         # Shell 控制器 + 页面管理
│   │   ├── homePage.js      # Home 页面渲染
│   │   ├── roundsPage.js   # Rounds 列表页面渲染
│   │   ├── coursesPage.js  # Courses 列表页面 + Drawer 详情
│   │   ├── courseDetailPage.js # Club 详情/编辑页面
│   │   ├── courseStructureEditor.js # 3列结构编辑器
│   │   ├── courseImportPage.js # GolfLive球场批量导入页面
│   │   └── newRoundPage.js    # New Round 创建页面
│   └── app.js          # 应用核心（Overlay Center 逻辑）
├── assets/
│   └── icons/          # 图标资源（备用）
├── bkimg.jpeg          # 默认背景图
├── archive/            # 历史版本存档（index-4.x / 5.x）
├── docs/               # 设计文档（功能说明书 / 视觉设计 / 架构说明）
└── CLAUDE.md           # 本文件
```

## 模块说明

### `js/scoreboard.js`
计分卡核心逻辑，无UI副作用：
- `deltaColorHex / deltaCardClass / pickerClass / totalBadgeColor` — Delta颜色映射
- `curHole / getGross / totalDelta / totalGross / fmtDeltaDisplay / deltaLabel` — 成绩计算与格式化
- `getSCRange / getSCWidth / getSCHeight / drawScorecardOverlay` — 计分卡Canvas绘制

### `js/ui.js`
界面操作与事件响应：
- `shotTypeLabel / autoType` — 击球类型标签与自动判断
- `miniToast` — 轻提示
- `buildHoleNav / makeStatCard` — 18洞导航栏构建（当前洞高亮）
- `buildDeltaBtn / buildTypeButtons / updateRightPanel` — 右侧面板刷新
- `openPicker / closePicker / buildPickerItems` — Delta选分弹窗
- `openSettings / closeSettings` — 设置抽屉
- `openNewRound / closeNewRound / doNewRound` — 新一轮模态框
- `setupLongPress / wireAll` — 长按支持与全局事件绑定

### `js/data.js`
v4.0 统一数据访问层（IIFE `D`），无依赖：
- `D.sc()` — scorecardData（业务数据：球场快照、球员、成绩）
- `D.ws()` — workspaceState（UI状态：当前洞、显示偏好、Canvas布局）
- `D.pid()` — 当前活跃球员ID
- `D.getCourseHole / setCourseHolePar / setCourseHoleYards` — 球场洞访问
- `D.getPlayerGross / getPlayerDelta / setPlayerGross / adjPlayerGross` — 成绩读写
- `D.setShotTag / setShotToPin / setShotNotes` — 击球标签读写
- `D.totalGross / totalDelta / projectedGross / playedCount` — 派生计算
- `D.save / load / migrateV531` — 持久化与迁移
- `D.syncS(S) / syncFromS(S)` — 兼容层：S 视图重建/回写

### `js/app.js`
应用核心，最后加载：
- `STRINGS / LANG / T / setLang / applyLang` — 国际化
- `S / scheduleSave / doSave / loadSaved` — 全局状态视图与持久化（通过 D API）
- `applyBg / setBgFile / clearBg` — 背景图管理
- `setPar / setDelta / adjDelta / reconcileShots / clearHole` — 成绩变更
- `setMode / prevShot / nextShot / setShotType / getShotToPin / setShotToPin` — 击球操作
- `gotoNextHole / setRatio / setRes / resetScorecardPos / resetAllPars` — 导航与设置
- `initCanvas / render / redrawOnly / drawOverlays / drawShotOverlay / rrect` — Canvas引擎
- `doExport / showExpStatus` — PNG导出
- `init` — 入口，DOMContentLoaded触发

## 加载顺序
```html
<script src="js/data.js"></script>            <!-- v4.0 数据层，无依赖 -->
<script src="js/roundTypes.js"></script>     <!-- JSDoc 类型定义，无运行时代码 -->
<script src="js/round.js"></script>          <!-- Round 数据模型，纯函数，无依赖 -->
<script src="js/courseDatabase.js"></script>  <!-- 无依赖 -->
<script src="js/scoreboard.js"></script>      <!-- 无依赖 -->
<script src="js/ui.js"></script>              <!-- 依赖 scoreboard.js, data.js -->
<script src="js/roundManager.js"></script>    <!-- 依赖 courseDatabase.js -->
<script src="js/coursePicker.js"></script>    <!-- 依赖 courseDatabase.js + roundManager.js + data.js -->
<script src="js/sessionIO.js"></script>      <!-- 依赖 data.js -->
<script src="js/import/importTypes.js"></script>     <!-- 无依赖，JSDoc only -->
<script src="js/import/fileSniffer.js"></script>     <!-- 无依赖 -->
<script src="js/import/golfliveParser.js"></script>  <!-- 依赖 SheetJS (XLSX) -->
<script src="js/import/roundBuilder.js"></script>    <!-- 依赖 data.js -->
<script src="js/import/importController.js"></script><!-- 依赖以上 import 模块 + UI -->
<script src="js/clubStore.js"></script>       <!-- Club 球会 CRUD，依赖 data.js -->
<script src="js/newRoundService.js"></script> <!-- New Round 服务，依赖 D + Round + ClubStore -->
<script src="js/app.js"></script>             <!-- 依赖所有以上 -->
<!-- App Shell（app.js init 完成后加载） -->
<script src="js/shell/router.js"></script>   <!-- Hash 路由，无依赖 -->
<script src="js/shell/homePage.js"></script>  <!-- Home 页面，依赖 data.js -->
<script src="js/shell/roundsPage.js"></script><!-- Rounds 页面，依赖 data.js -->
<script src="js/shell/coursesPage.js"></script><!-- Courses 页面，依赖 clubStore.js -->
<script src="js/shell/courseDetailPage.js"></script><!-- Club 详情编辑，依赖 clubStore.js -->
<script src="js/shell/courseStructureEditor.js"></script><!-- 结构编辑器，依赖 clubStore.js -->
<script src="js/shell/courseImportPage.js"></script><!-- GolfLive球场导入，依赖 clubStore.js -->
<script src="js/shell/newRoundPage.js"></script><!-- New Round 页面，依赖 NewRoundService -->
<script src="js/shell/shell.js"></script>     <!-- Shell 控制器，依赖以上 shell 模块 -->
```

## 数据模型 (v4.0)
- localStorage keys: `golf_v4_scorecard`（业务数据），`golf_v4_workspace`（UI状态），`golf_v531_bg`（背景图base64）
- 旧版 `golf_v531` 自动迁移到 v4 格式，保留不删除
- `D.sc()` — scorecardData：球场快照 + 球员列表 + 成绩数据
- `D.ws()` — workspaceState：当前洞、显示偏好、Canvas布局
- `S` — 兼容视图对象，通过 `D.syncS(S)` 重建
- 球场洞快照：`{ number, par, yards, holeId }`
- 球员成绩：`{ gross, putts, penalties, notes, status, shots[] }`
- 击球数据：`{ type, purpose, result, flags[], notes, lastTag, toPin }`
- Gross 为主数据，Delta = gross - par（派生值）

## 开发注意事项
- 所有JS为全局函数，无模块系统，脚本加载顺序即依赖顺序
- Canvas渲染基准宽度 1920px，所有绘制坐标通过 `scale = w/1920` 缩放
- 背景图单独存储于 localStorage（base64），超配额时静默失败
- 不使用任何构建工具，直接浏览器打开 index.html 即可运行

## Release & Changelog Rules

本项目使用 **Semantic Versioning**：`MAJOR.MINOR.PATCH`

| 类型 | 触发条件 | 示例 |
|------|----------|------|
| PATCH | UI微调、小修复、不改变行为的重构 | 颜色调整、文字修正、路径规范 |
| MINOR | 新增功能但向后兼容 | 新增显示选项、新快捷键 |
| MAJOR | 破坏兼容或重大架构改动 | 数据结构变更、localStorage key更换 |

### 每次完成代码修改任务后，必须按顺序执行：

**1. 升级 VERSION 文件**
- 读取根目录 `VERSION`（纯版本号一行，如 `5.3.2`）
- 按改动类型升级对应位，写回 `VERSION`（只保留一行，无空行）

**2. 在 README.md 的 `## Changelog` 下方插入新条目（最新在前）**
```
### vX.Y.Z — YYYY-MM-DD
- 变更点1（用户可感知的描述）
- 变更点2
```
- 若 `## Changelog` 区块不存在，先创建再插入
- 只追加，不覆盖已有条目

**3. 输出建议 git commit message**
- 格式：`vX.Y.Z: <简短描述>`
- 示例：`v5.3.2: fix OUT/IN badge color, widen shot overlay right panel`
