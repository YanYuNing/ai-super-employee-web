# Supabase 项目首次部署：先检查，不覆盖本地数据

项目目标 Supabase：`jspkpnnlvgbifujzimpq`。Supabase Dashboard 的 GitHub 仓库连接与 Next.js 应用部署不是一回事：数据库与 Storage 由 Supabase 提供，网站代码最终应部署到 Vercel。

## 1. 先取连接串

在 Supabase Dashboard 顶部点击 Connect，复制 Transaction pooler（运行时 DATABASE_URL，通常 6543）与 Session pooler（DIRECT_URL，通常 5432）地址。连接主机必须按弹窗提供值填写，不要猜。

保留本地源库：

```dotenv
LOCAL_SOURCE_DATABASE_URL="postgresql://postgres:本地密码@127.0.0.1:5432/ai"
```

将 `DATABASE_URL` 换成 Supabase Transaction Pooler，将 `DIRECT_URL` 换成 Supabase Session Pooler。`.env` 不要提交 Git。

## 2. 运行只读预检

```powershell
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run db:preflight:supabase
npm.cmd run db:inspect:supabase
```

只有目标 `public` schema 中没有需要保留的应用数据时，才继续。

## 3. 创建 schema 并迁移数据

```powershell
npm.cmd run db:push:supabase
npm.cmd run db:check
npm.cmd run db:migrate:postgres
npm.cmd run db:check
```

复制脚本以只读事务访问本地源库 `ai`，并拒绝把同一库当作目标。已知历史表 `mysql_prisma_migrations_archive` 会明确跳过；其他未映射业务表会让脚本停止，需要先人工确认，不能全局忽略。目标已有行也会使迁移停止。

## 4. Storage 和员工截图

```powershell
npm.cmd run storage:setup:supabase
npm.cmd run storage:migrate:supabase
npm.cmd run seed:employee-showcase:supabase
npm.cmd run test:storage
```

Storage 迁移前把 `LOCAL_UPLOAD_ROOT` 指向旧媒体文件的真实目录。公共宣传图可以放入公开 bucket；私密客户文档不要放进公开 bucket。

## 5. Vercel

先本地 `npm.cmd run build`；通过后提交 GitHub 并导入 Vercel。设置运行时 `DATABASE_URL`、`DIRECT_URL`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`、`ADMIN_SESSION_SECRET`、`STORAGE_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`NEXT_PUBLIC_SITE_URL` 和 `DATABASE_CONNECTION_LIMIT`。不要把 `LOCAL_SOURCE_DATABASE_URL` 或本机密码配置到 Vercel。
