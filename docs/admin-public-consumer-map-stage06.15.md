# 后台字段 ↔ 用户端消费者审计（阶段 06.15）

目标：后台不是“数据库字段展示器”，而是用户端内容的编辑入口。每个可编辑项必须满足至少一个条件：

1. 用户端存在明确的读取/渲染消费者；
2. 它是 SEO、发布状态、权限或内部运营功能，虽然不直接显示，但会影响真实用户端行为。

## 已确认保留的核心管理能力

| 后台模块 | 用户端消费者 / 作用 | 结论 |
|---|---|---|
| 首页管理 | `/` 读取各首页 section 与 hero task | 保留 |
| 9 大 AI 产品 | `/products`、`/products/[slug]` | 保留 |
| 解决方案 | `/solutions`、详情页 | 保留 |
| 客户案例 | `/cases`、详情页 | 保留 |
| 资源中心编排 | `/` 与 `/resources` 的统一资源入口 | 保留 |
| 资源资料 | `/resources/library`、`/resources/[slug]` | 保留 |
| 教程 | `/docs`、`/docs/[slug]` | 保留 |
| Skill | `/skills`、`/skills/[slug]` | 保留 |
| Prompt | `/prompts`、`/prompts/[slug]` | 保留 |
| 下载管理 | `/downloads`、下载版本 | 保留 |
| 文章/新闻 | `/articles`、详情页 | 保留 |
| FAQ | `/faq` | 保留 |
| 更新日志 | `/changelog` | 保留 |
| 文件资产 | 被图片、视频、文档、下载选择器消费 | 保留 |
| 页面管理 | 管理系统页文案、SEO、自定义扩展区块 | 保留，但字段按消费者收窄 |
| 全站内容 | 导航、页脚、首页运行文案 | 保留 |
| 网站设置 | 品牌、站点元数据、联系信息、SEO | 保留 |
| 销售线索 | 内部运营，不直接展示 | 保留 |
| 管理员 / 角色 / 权限 | 内部安全能力 | 保留 |
| 文件存储 | OSS、本地/CDN 运行能力 | 保留 |

## 本轮确认并隐藏的无前台消费者区块

### 资源中心

- `resources/hero`
- `resources/cards`
- `resources/empty`

原因：当前资源中心页面由 `resource-hub` + 数据库中的 Skills / Prompt / 教程 / 下载 / 资料动态生成，上述旧区块没有真实用户端读取方。

### 下载中心

- `downloads/detail`

原因：当前下载中心只有版本列表与直接下载，没有独立详情页，因此该区块没有真实前台消费者。

### 联系我们

- `contact/form`

原因：表单由 `ContactForm` 组件直接渲染，不从数据库 section 读取。

## 已清理的历史冗余字段

- 首页 section 通用 `content / imageUrl / videoUrl`：系统区块不再允许通过首页编辑器保存；自定义扩展区块仍支持，并由前台通用扩展渲染器消费。
- `home` 页面级正文与封面：canonical 首页不存在页面级正文/封面消费者。
- `about` 页面级正文与封面：关于页正文由 `body` section 消费，页面级字段不再消费。
- `contact` 页面级正文与封面：不存在对应前台消费者。
- `site.common`：统一站点配置后已弃用。
- 网站设置中的 `address / downloadUrl / socialLinks`：当前用户端没有对应消费者，保存时强制清空。
- 首页旧的 `heroTask* / heroFloating*` 平铺字段：统一迁移到 `home/hero` section 的 `data.task / floatingStatuses`。
- 首页 `ai-employees.items`：当前前台员工矩阵以 `Product` 数据为唯一来源，历史 JSON 中的重复员工列表不会被读取，已纳入一次性清理。
- Skill `downloadCount` 与 Prompt `copyCount`：当前前后台 UI 不再展示，数据库字段保留以兼容历史数据。

## 用户端反向验证原则

新增后台字段时，应该同时在该文档的“用户端消费者”里登记对应页面/组件；如果找不到消费者，就不要加入普通编辑表单，必要时只保留在高级 JSON / 内部运维层。
