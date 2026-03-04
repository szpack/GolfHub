# GolfOverlay — 项目说明

## 项目名称
GolfOverlay

## 用途
高尔夫赛事直播角标助手。在直播截图或背景图上叠加计分卡、当前洞击球信息，并导出为透明PNG角标图片，用于视频制作或直播上屏。

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
├── index.html          # 页面结构（HTML骨架）
├── css/
│   └── overlay.css     # 全部样式
├── js/
│   ├── scoreboard.js   # 计分卡逻辑
│   ├── ui.js           # 界面操作
│   └── app.js          # 应用核心（最后加载）
├── assets/
│   └── icons/          # 图标资源（备用）
├── bkimg.jpeg          # 默认背景图
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

### `js/app.js`
应用核心，最后加载：
- `STRINGS / LANG / T / setLang / applyLang` — 国际化
- `defState / S / scheduleSave / doSave / loadSaved` — 全局状态与持久化
- `applyBg / setBgFile / clearBg` — 背景图管理
- `setPar / setDelta / adjDelta / reconcileShots / clearHole` — 成绩变更
- `setMode / prevShot / nextShot / setShotType / getShotToPin / setShotToPin` — 击球操作
- `gotoNextHole / setRatio / setRes / resetScorecardPos / resetAllPars` — 导航与设置
- `initCanvas / render / redrawOnly / drawOverlays / drawShotOverlay / rrect` — Canvas引擎
- `doExport / showExpStatus` — PNG导出
- `init` — 入口，DOMContentLoaded触发

## 加载顺序
```html
<script src="js/scoreboard.js"></script>  <!-- 无依赖 -->
<script src="js/ui.js"></script>           <!-- 依赖 scoreboard.js -->
<script src="js/app.js"></script>          <!-- 依赖 scoreboard.js + ui.js -->
```

## 数据模型
- localStorage key: `golf_v531`（状态），`golf_v531_bg`（背景图base64，单独存储）
- 全局状态对象 `S`，结构见 `defState()`
- 18个洞：`{par, delta, shots[], shotIndex, manualTypes{}, toPins{}}`
- Delta：相对标准杆差值（-1=小鸟, 0=标准杆, +1=柏忌）

## 开发注意事项
- 所有JS为全局函数，无模块系统，脚本加载顺序即依赖顺序
- Canvas渲染基准宽度 1920px，所有绘制坐标通过 `scale = w/1920` 缩放
- 背景图单独存储于 localStorage（base64），超配额时静默失败
- 不使用任何构建工具，直接浏览器打开 index.html 即可运行
