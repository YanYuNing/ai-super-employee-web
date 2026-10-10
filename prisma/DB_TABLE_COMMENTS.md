# 数据库表说明

> 本项目数据库 `ai` 已按 CMS 业务划分表用途。Stage 05.1 增加 MySQL 表级 COMMENT，使用 Navicat / DBeaver / MySQL Workbench 查看表结构时即可直接看到中文说明。

| 表 | 中文说明 |
|---|---|
| products | AI产品 / 9大AI超级员工 |
| product_features | 产品功能卖点 |
| skills | Skills资源 |
| skill_versions | Skill版本 |
| prompt_categories | Prompt分类 |
| prompts | Prompt内容 |
| resource_categories | 资源分类 |
| resources | 资源中心内容 |
| tutorial_categories | 教程分类 |
| tutorials | 教程内容 |
| downloads | 下载产品 |
| download_versions | 下载版本 |
| solutions | 行业解决方案 |
| cases | 客户案例 |
| articles | 官网文章 / 新闻 |
| faqs | 常见问题 |
| leads | 销售线索 |
| changelogs | 更新日志 |
| site_settings | 网站全局设置 / SEO |
| pages | CMS页面 |
| page_sections | CMS页面区块 |
| media_assets | 图片/视频/文件素材 |
| admins | CMS管理员 |
| roles | 后台角色 |
| permissions | 后台权限 |
| role_permissions | 角色-权限关系 |
| admin_roles | 管理员-角色关系 |
| home_configs | 历史首页配置兼容表 |
| users | 用户账号 |

## 数据初始化原则

- `seed-stage05-1-content.ts` 负责首次正式内容装载。
- 产品基础信息会同步更新为源资料中的正式版本；产品功能采用“缺少才创建”，不会删除后台已有功能。
- 解决方案、资源、教程、Prompt、文章采用 slug 幂等初始化；已有同 slug 内容不会被覆盖。
- FAQ 采用问题文本判断，已有问题不会重复创建。
- 不执行 `DROP DATABASE`、`prisma migrate reset` 或清空表操作。
- 客户案例没有使用未经资料支持的虚构客户名称或虚构数据；真实案例应由后台案例管理录入。
