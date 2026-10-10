# 后台与用户端内容一致性审计（Stage 06.14）

本次审计原则：后台出现的字段/区块必须存在明确的用户端消费者；如果没有消费者，就从日常后台表单中移除，必要时保留数据库字段用于历史兼容。

## 已移除/收口
- 首页区块的通用 `正文 / 区块图片 / 区块视频` 不再作为后台常规字段；首页 API 保存时会统一清空这些历史字段。
- `site.common` 不再进入后台“全站内容”。
- 系统页面编辑器不再提供系统区块的通用正文/图片/视频；只有 About body 明确开放，且“自定义扩展区块”才开放这些能力。
- `contact/form` 由前端 ContactForm 固定渲染，不再在后台展示；下一次保存页面时会清理该历史区块。
- 旧 CMS `media/pages` 入口继续保留兼容跳转，但不再作为后台常规菜单。
- 旧 `/cms-page/[slug]` 对标准官网页面统一重定向到各自正式用户端路由，避免同一页面存在两套内容消费者。
- Skills “下载量”和 Prompt “复制次数”这类没有实际使用链路的列表指标已移除。

## 已接通用户端
- 页面正文：系统公共扩展组件会真实渲染。
- 自定义区块：正文/图片/视频/列表/按钮均可在用户端展示。
- 结构化 JSON：自定义扩展区块支持 `title/subtitle/content/imageUrl/videoUrl/items/button/primaryButton` 等字段直接驱动用户端。
- Skill / Prompt / 教程 / 资源 / 文章标签已经在用户端列表/详情展示。
- About body 的正文、图片、视频、核心指标、价值原则已接通。
- 首页 Hero 执行卡使用 `hero.data.task.*`，后台编辑即可改变用户端执行任务、引擎、模式、进度与浮动状态。

## 一次性历史数据清理
生产数据库执行：`npm run repair:stage06.14`。

脚本会清理：旧 `site.common`、旧 `site.home` Hero task 平铺字段、首页历史通用正文/图片/视频、About 联系页 `form` 旧区块，以及 Settings 中已不再用于用户端的 `address/downloadUrl/socialLinks` 历史值。

### 本轮继续清理的无前台消费者区块

- `resources/hero`、`resources/cards`、`resources/empty`：资源中心现在统一由 `resource-hub` 驱动，以上旧区块不再展示到用户端。
- `downloads/detail`：当前下载中心没有独立详情页，因此该区块没有实际前台消费者。
- 前台下载列表同时将 `detail` 视为保留系统键，避免历史数据被通用扩展区块再次渲染。
