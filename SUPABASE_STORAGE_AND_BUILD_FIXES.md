# Supabase Storage 与生产构建修复说明

## 本次错误

- Supabase Storage 查询不存在的 Bucket 时，REST API 可能返回 HTTP 400，但响应体包含 `statusCode: 404` / `code: NoSuchBucket`。初始化脚本现在会识别这类响应并创建 Bucket。
- `app/download/page.tsx` 曾同时存在重定向组件与实际页面两个 `default` 导出。现在 `/download` 作为兼容别名重定向到唯一下载页 `/downloads`。
- 媒体同步 API 导入了不存在的 `syncLocalAssets`。现在调用实际导出的 `syncLocalResourceAssets`。
- 本地上传路径的 Turbopack 文件追踪警告已通过运行时路径忽略标记收窄。

## 执行顺序（Windows PowerShell）

1. 确认 `.env` 的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET=site-assets` 正确。
2. 执行 `npm.cmd run storage:setup:supabase`。该脚本对不存在的 Bucket 创建公开的 `site-assets` Bucket；如果同名 Bucket 已存在且私有，不会自动公开它。
3. 成功后执行 `npm.cmd run test:storage`，确认 `provider: SUPABASE`。
4. 再执行 `npm.cmd run storage:migrate:supabase`，把可访问的本地公开资源上传至云存储。
5. 执行 `npm.cmd run build`。

不要把服务端密钥放入 `NEXT_PUBLIC_*`，不要提交 `.env`。如果生产构建仍失败，请提供完整的新报错。


## 图片迁移中断后的续跑（本次 Prompt.fileUrl 修复）

如果此前已看到 `Migrated 20/66`、`Migrated 40/66`、`Migrated 60/66`，但随后在 `rewriteDatabaseReferences` 阶段报错：

1. 不要删除 Supabase Storage 中已经上传的对象；
2. 不要重新执行 `db:push` 或 `db:migrate:postgres`；
3. 替换本版本源码后，重新执行 `npm.cmd run storage:migrate:supabase`。

脚本已修复 `Prompt.fileUrl`、`Tutorial.fileUrl` 并会按 Prisma 当前运行时模型过滤不存在的字段。对之前已上传的 SUPABASE 资产，会根据 `storageKey` 重建常见旧本地 URL 别名，继续更新页面区块和 CMS 内容引用。因此重跑会跳过已经迁移的 60 张文件，专注处理仍在 LOCAL 状态的资产与引用更新。

如果输出仍报告 `Missing local file`，表示这些对象的文件在配置的本机上传根目录中确实不存在；它们不会被虚构或覆盖。需要从原电脑/备份找回后放进 `LOCAL_UPLOAD_ROOT` 对应路径，或上线后从后台重新上传。当前日志中缺失的包括历史 Skill 压缩包、视频、Prompt 文件、首页图片和旧 Logo。请勿删除本地 `public` 或上传目录，直到云端文件和官网引用全部验证完成。
