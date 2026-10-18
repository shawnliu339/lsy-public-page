# Material 风格设计标准参考页（移动端）

本目录以 `design-standard-paper-mobile` 的 Dashboard 信息结构为对照基准，但视觉系统完整替换为 Material Dashboard Pro：包含字体、画布、顶栏、侧栏、菜单状态、图标、卡片、图表、配置面板、阴影、圆角和交互反馈，不混用 Paper 外观。

移动端基准设备为 iPhone 16 Pro Max，CSS 视口按 `440 × 956` 验证。视觉参数参考 Creative Tim 的 Material Dashboard Pro Analytics 官方演示页及浏览器计算样式：

- 字体：`Inter`，并提供 Helvetica / Arial 系统回退
- 页面画布：`#F7F7F7`
- 卡片：白色、`1px #E5E5E5` 边框、`8px` 圆角、`0 1px 2px rgba(0,0,0,.05)` 阴影
- 侧栏：距视口 `8px`、宽 `224px`、白色悬浮面板、Material Symbols 图标
- 主强调色：Material Green `#43A047`
- 移动端内容边距：`12px`，Dashboard 卡片为单列布局

## 预览

在本目录启动任意静态 HTTP 服务后访问 `/#/admin/overview`。右下角设置按钮可切换侧栏明暗、强调色和桌面迷你侧栏；选择会保存在浏览器本地。

Dashboard 保留 Paper Mobile 对照页的相同内容：

- Capacity、Revenue、Errors、Followers 四张指标卡
- 三张相同数据的趋势图
- Global Sales 世界地图和国家明细
- 相同的页面搜索、通知、抽屉式导航和主题设置交互

侧栏中的其他路由仍可用于查看组件和交互，但本轮视觉校准重点是 Dashboard。

## 文件

- `index.html`：Material 页面框架、侧栏、顶栏和配置面板
- `styles.css`：Material 视觉变量、组件和移动端响应式规则
- `app.js`：Dashboard 数据、客户端路由、主题状态和原型交互
- `assets/world-map.svg`：Dashboard 使用的 CC0 世界地图

世界地图来源为 Wikimedia Commons 的 [Blank world map Equal Earth projection](https://commons.wikimedia.org/wiki/File:Blank_world_map_Equal_Earth_projection.svg)，采用 CC0 1.0 公共领域许可。
