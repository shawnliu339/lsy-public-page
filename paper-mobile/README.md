# Paper 风格设计标准参考页（移动端校准版）

本目录用于确认后续设计标准采用的视觉方向。当前页面以 Vue Paper Dashboard 2 PRO 官方 Demo 的生产 CSS、浏览器计算样式和同尺寸截图为校准依据，重新实现为本地静态参考；不依赖其 Vue/Bootstrap 运行时，字体通过 Google Fonts 加载 Montserrat，并提供系统字体回退。

本副本专门用于 Dashboard 移动端校准。基准设备为 iPhone 16 Pro Max，CSS 视口按 `440 × 956` 验证；Dashboard 采用与官方相同的抽屉式侧栏逻辑，正文恢复为全宽单列布局。其他页面暂不在本轮移动端校准范围内。

## 预览

在本目录启动任意静态 HTTP 服务后访问：

- `/#/admin/overview`：Dashboard Overview
- `/#/admin/widgets`：Widgets
- `/#/pages/user`：User Profile
- `/#/components/buttons`：Components 页面入口示例
- `/#/forms/regular`：Forms 页面入口示例
- `/#/table-list/paginated`：Paginated Tables
- `/#/maps/google`：Maps 页面入口示例
- `/#/charts`：Charts
- `/#/calendar`：Calendar
- `/?config=open#/table-list/paginated`：打开主题面板的表格对照状态

左侧导航包含官方 Demo 对应的 26 个路由，菜单组可以展开或收起。右侧齿轮可以切换侧栏背景、激活色和迷你侧栏，选择会保存在浏览器本地。

## 已实现交互

- 客户端路由、左侧菜单展开/收起与当前页面高亮
- 全局页面搜索、通知菜单、提示消息和通用确认弹窗
- 主题颜色、侧栏背景与迷你侧栏切换及本地持久化
- 表单提交、必填校验、范围控件和三步向导
- 表格搜索、排序、分页、查看、编辑与删除演示
- 日历视图切换、前后翻月与返回当前月
- 地图缩放和复位、任务完成状态、面板折叠

所有功能属于设计原型交互，不连接真实后端、地图服务或用户认证系统。

## 文件

- `index.html`：统一页面框架、侧栏、顶栏、图标和主题配置面板
- `styles.css`：全部视觉样式和响应式规则
- `app.js`：全部页面模板、客户端路由、主题状态和原型交互
- `assets/world-map.svg`：基于 Natural Earth 数据的 CC0 世界地图，用于 Dashboard 地图卡片

当前内容用于视觉校准。确认风格后，再从这些页面提取正式的颜色、字体、间距、圆角、阴影和组件规范。

当前基准色：侧栏 `#66615B`、激活黄 `#FBC658`、页面底色 `#F4F3EF`、信息蓝 `#51BCDA`、成功绿 `#6BD098`、危险橙 `#EF8157`。

当前几何基准：侧栏 `260px`、顶栏 `63px`、内容边距与卡片间距 `30px`、卡片圆角 `12px`、卡片阴影 `0 6px 10px -4px rgba(0,0,0,.15)`。Dashboard 与 Paginated Tables 已按 `1440px` 视口完成重点视觉对照。

世界地图来源为 Wikimedia Commons 的 [Blank world map Equal Earth projection](https://commons.wikimedia.org/wiki/File:Blank_world_map_Equal_Earth_projection.svg)，采用 CC0 1.0 公共领域许可。
