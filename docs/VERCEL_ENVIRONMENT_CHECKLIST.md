# Vercel 生产环境变量检查表

在 Vercel Project → Settings → Environment Variables 中配置 Production（需要预览时也配置 Preview）。所有敏感变量只填在 Vercel 控制台，不提交到 Git。

必需变量：

- `DATABASE_URL`: Supabase Transaction Pooler（通常 6543），从 Dashboard → Connect 复制。
- `DIRECT_URL`: Supabase Session Pooler（通常 5432）或 Prisma CLI 可用的 direct URL；仅用于 Prisma 配置/CLI，不要使用本机 localhost。
- `SUPABASE_URL`: `https://jspkpnnlvgbifujzimpq.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`: 从 Supabase API Keys 页面获取的服务端密钥，绝不使用 `NEXT_PUBLIC_` 前缀。
- `SUPABASE_STORAGE_BUCKET`: `site-assets`（以实际创建的 Bucket 为准）。
- `ADMIN_SESSION_SECRET`: 至少 32 字节随机值。
- `STORAGE_SECRET`: 与会话密钥不同的随机值。
- `ADMIN_USERNAME`、`ADMIN_PASSWORD`: 生产管理员凭据，禁止使用默认弱口令。
- `NEXT_PUBLIC_SITE_URL`: Vercel 域名或自定义域名，必须使用 `https://`。
- `DATABASE_CONNECTION_LIMIT`: 根据 Supabase 连接池容量设置，例如 `3` 起步。

不要设置在 Vercel：`LOCAL_SOURCE_DATABASE_URL`。它只供本地一次性读取现有 PostgreSQL `ai` 数据。

## Prisma 使用连接池

对于 Vercel serverless 运行时，`DATABASE_URL` 使用 Transaction Pooler；Schema 推送/单次复制使用 Session Pooler `DIRECT_URL`（如果网络支持 IPv6，也可按 Supabase Dashboard 提供的连接方式使用 direct connection）。端口和主机名以 Connect 弹窗为准，不能自行猜测。

## 发布步骤

1. 本地执行 `npm.cmd run build`。
2. `git status --short` 确认没有 `.env`。
3. 推送 GitHub 仓库后在 Vercel Import Project。
4. 设置 Production 环境变量并 Deploy。
5. 发布成功后把 `NEXT_PUBLIC_SITE_URL` 改为最终域名并重新部署。
