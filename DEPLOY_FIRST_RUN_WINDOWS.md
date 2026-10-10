# 豫辉 AI 超级员工：首次部署到 Supabase + Vercel（Windows）

目标 Supabase 项目：`jspkpnnlvgbifujzimpq`

> Supabase 负责 PostgreSQL 和 Storage；Next.js 网站代码需要放入 GitHub，再由 Vercel 部署。Supabase Dashboard 显示“No repository connected”不阻挡数据库使用，也不表示数据库不健康。

## A. 在 Supabase 获取连接串

1. 打开 `https://supabase.com/dashboard/project/jspkpnnlvgbifujzimpq`。
2. 点击页面顶部 **Connect**。
3. 复制 **Transaction pooler** 连接串用于运行时 `DATABASE_URL`（通常端口 6543）。
4. 复制 **Session pooler** 连接串用于 `DIRECT_URL` / Prisma CLI（通常端口 5432）。在 IPv6 可用的网络下也可以使用 dashboard 给出的 direct connection。
5. 不要猜测 Pooler Host、用户名或端口，以 Connect 对话框为准。

## B. 修改本地项目根目录 `.env`

备份 `.env` 后，只替换目标连接：

```dotenv
# 一直保留本地原始 PostgreSQL `ai`，这是只读迁移源；不要替换成 Supabase。
LOCAL_SOURCE_DATABASE_URL="postgresql://postgres:本地密码@127.0.0.1:5432/ai"

# 替换为 Supabase Connect 对话框给出的真实 Transaction Pooler URL。
DATABASE_URL="粘贴 Supabase Transaction Pooler 完整连接串"

# 替换为 Supabase Connect 对话框给出的真实 Session Pooler URL。
DIRECT_URL="粘贴 Supabase Session Pooler 完整连接串"

SUPABASE_URL="https://jspkpnnlvgbifujzimpq.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="从 Supabase 控制台获取的服务器端密钥"
SUPABASE_STORAGE_BUCKET="site-assets"
SUPABASE_STORAGE_MAX_FILE_SIZE_MB="50"
SUPABASE_STORAGE_MAKE_PUBLIC="false"

# 首次数据迁移期间可暂时保留 localhost；网站部署 Vercel 后改成 https://真实域名。
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

同时确认 `ADMIN_SESSION_SECRET`、`ADMIN_PASSWORD` 和 `STORAGE_SECRET` 都已替换为独立强值。连接串若有特殊字符密码，请使用 URL 编码。**不要将 `.env` 提交到 GitHub，也不要把 Service Role Key 放入 `NEXT_PUBLIC_` 变量。**

## C. 先检查，不写数据

进入项目目录 `D:\Documents\demo\Supabase-Vercel`：

```powershell
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run db:preflight:supabase
npm.cmd run db:inspect:supabase
```

- `db:preflight:supabase` 验证 `LOCAL_SOURCE_DATABASE_URL` 仍是本机 `ai`，目标 `DATABASE_URL` 与 `DIRECT_URL` 是 Supabase 主机。
- `db:inspect:supabase` 只读显示云端 public 表和行数。如果发现有数据的业务表，停止操作，先判断是否需要保留。

## D. 创建 Supabase 表并复制本地业务数据

只在确认目标 `public` schema 为空或现有表均可被本项目管理后执行：

```powershell
npm.cmd run db:push:supabase
npm.cmd run db:check
npm.cmd run db:migrate:postgres
npm.cmd run db:check
```

`db:push:supabase` 内置目标 URL 预检和只读数据检查。数据迁移脚本以只读事务连接本地 `ai`，所有插入仅指向 Supabase 的 `DIRECT_URL`。它拒绝同库源/目标、非空目标和未映射业务表，复制后会比较源/目标行数并重设自增序列。仅明确跳过历史归档表 `mysql_prisma_migrations_archive`；如果还有其他未映射表，会停止并显示表名，需要人工确认。

## E. Supabase Storage 与截图

确认 `LOCAL_UPLOAD_ROOT` 指向旧上传文件实际目录后执行：

```powershell
npm.cmd run storage:setup:supabase
npm.cmd run storage:migrate:supabase
npm.cmd run seed:employee-showcase:supabase
npm.cmd run test:storage
```

公共宣传图片可放入公开 bucket；不要将包含客户敏感信息的私密文件放入公开 bucket。迁移输出中若出现 missing/failed/private assets，请先处理，不要切生产流量。

## F. 本地生产构建测试

```powershell
npm.cmd run build
npm.cmd run start
```

检查首页、产品中心、资源中心、后台登录、页面管理、Logo 替换、图片上传/替换、下载项和版本编辑。测试通过后停止本地服务。

## G. Vercel 部署

1. 将源码提交到 GitHub，先用 `git status --short` 检查没有 `.env`、密码、密钥、备份或数据库导出文件。
2. 打开 `https://vercel.com/new`，Import Git Repository。
3. 在 Vercel Project → Settings → Environment Variables 配置：`DATABASE_URL`、`DIRECT_URL`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`、`SUPABASE_STORAGE_MAX_FILE_SIZE_MB`、`ADMIN_SESSION_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`STORAGE_SECRET`、`NEXT_PUBLIC_SITE_URL`、`DATABASE_CONNECTION_LIMIT`。
4. 不要在 Vercel 设置 `LOCAL_SOURCE_DATABASE_URL`，它只用于本地一次性迁移。
5. Build Command 使用 `npm run build`。Deploy 成功后，把 `NEXT_PUBLIC_SITE_URL` 改成 Vercel 给出的真实 HTTPS 域名并重新部署。
6. 实际打开生产域名，检查前台、后台认证、CMS 保存、Logo、图片、视频、下载链接。确认通过后再考虑更换自定义域名。

## 回滚原则

本地 PostgreSQL `ai` 在迁移完成前后都保留不动。不要为了清理而删除本地原库。Supabase 目标出现非空数据时不要重复导入；需要重试时先对比源/目标报表，并备份云端。`db:push:supabase` 不是数据迁移工具，业务数据复制由 `db:migrate:postgres` 执行。
