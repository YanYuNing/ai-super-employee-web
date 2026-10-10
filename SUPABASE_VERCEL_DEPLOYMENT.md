# Supabase PostgreSQL + Storage + Vercel 部署说明（现有本地 PostgreSQL 版本）

## 重要前提：当前使用已有 PostgreSQL `ai`

你已确认项目数据保存在本机 PostgreSQL 数据库 `ai`，因此本流程**不要求使用 `ai_migration_test`**，也不使用 MySQL 连接。`.env.example` 已改为本地 `ai` 作为当前开发数据库。`LOCAL_SOURCE_DATABASE_URL` 与当前运行数据库可以暂时指向同一个 `ai`；但迁移脚本 `db:migrate:postgres` 只有在目标切换到 Supabase 后才运行，否则会检测到源/目标是同一个库并拒绝写入。

请先备份 PostgreSQL `ai`。你此前在聊天中粘贴过数据库口令，建议在完成修复后将本地 PostgreSQL 密码改为强密码并更新 `.env`，不要将真实 `.env` 提交 Git，也不要再分享包含口令的连接串。

## 1. 修复当前 `public.SkillStatus` 不存在

报错 `类型 "public.SkillStatus" 不存在` 表示 Prisma Schema 将 `skills.status` 等字段定义为 PostgreSQL enum，但当前 `public` schema 缺少相应 enum 类型，或者已有列仍为 varchar/text。不要先对现有数据库盲目运行 `prisma db push`，也不要清空数据库。

### 步骤

1. 确认项目根目录 `.env` 的 `DATABASE_URL` 和 `DIRECT_URL` 都指向 `127.0.0.1:5432/ai`。
2. 首次安装依赖时运行 `npm.cmd install`；已有完整依赖则可直接继续。
3. 生成与当前 PostgreSQL Prisma Schema 对应的客户端：

   ```powershell
   npm.cmd run prisma:generate
   ```

4. 先在 Navicat 对数据库 `ai` 做结构与数据备份。
5. 在同一个 PowerShell 窗口执行下面的显式确认，然后运行修复脚本：

   ```powershell
   $env:PG_ENUM_REPAIR_CONFIRM = "ai"
   npm.cmd run db:repair:postgres-enums
   Remove-Item Env:PG_ENUM_REPAIR_CONFIRM
   ```

修复脚本会先检查目标数据库名称、所有受影响的列和全部现存枚举值；只有现存值全部属于 Prisma Schema 允许值时，才在事务内创建缺失的 PostgreSQL enum 类型，并把对应状态列转换为正确类型。若发现历史值不合法或某张表/列缺失，会停止并回滚，不会自动丢弃、覆盖业务记录。脚本默认只允许数据库名 `ai`。输出中若显示不兼容值，请保留完整报错并先人工映射，**不要为了让程序启动而删除记录**。

6. 验证数据库：

   ```powershell
   npm.cmd run db:check
   npm.cmd run dev
   ```

打开 `http://localhost:3000`，重点检查首页、产品、资源中心、后台登录、页面管理、下载管理和图片引用。

## 2. 不要现在执行的命令

在当前已经有业务表与记录的本地 `ai` 库上，暂时不要执行：

```powershell
npm.cmd run db:push:supabase
npm.cmd run db:migrate:postgres
```

第一条会根据 Prisma Schema 调整目标结构，必须先看清将发生的变更；第二条是把本地源库复制到 `DIRECT_URL` 目标库的单向迁移工具。源/目标同为 `ai` 时应拒绝运行。当前先修复 enum 类型并正常启动项目。

## 连接当前 Supabase 项目（先做只读检查）

你当前的 Supabase 项目为 `jspkpnnlvgbifujzimpq`，Dashboard 显示 Healthy 是好事；`No repository connected` 只是没有 Git 仓库连接到 Supabase，Next.js 应用代码稍后应连接到 Vercel；`No migrations` 表示该项目还没有迁移历史记录，不代表它需要被删除或重建。

在 Dashboard 顶部点击 **Connect**，分别复制：

- **Transaction pooler** 连接串用于 Vercel 运行时 `DATABASE_URL`（通常 6543）。
- **Session pooler** 连接串用于本地 Prisma CLI 和迁移目标 `DIRECT_URL`（通常 5432）。

Free 计划的直接数据库地址可能只支持 IPv6；本机和常见云运行环境通常优先使用 Dashboard 提供的 pooler 地址。不要根据区域猜测 pooler 主机名。

先把真实连接串填入本地 `.env`，再运行：

```powershell
npm.cmd run db:preflight:supabase
npm.cmd run db:inspect:supabase
```

这两条命令不会写数据库。第一条确认本地源库是 `ai` 且两个目标 URL 都是 Supabase 主机；第二条只读列出云端 `public` 表及记录数。如果云端已经有业务表和记录，应暂停并检查；只有确认目标业务 Schema 为空或所有已有内容均可替换时，才进入下面的建表步骤。

## 3. 把本地 `ai` 迁到 Supabase

仅在本地网站验收通过后进行。进入 Supabase Dashboard > Connect，复制实际连接串。使用单独备份后、没有要保留业务数据的 Supabase 目标库。

- 保持 `LOCAL_SOURCE_DATABASE_URL` 指向本地 `ai`，供迁移脚本只读读取。
- 将 `DATABASE_URL` 设置成 Supabase Transaction Pooler 连接（常见端口 6543，使用 Dashboard 给出的参数）。
- 将 `DIRECT_URL` 设置成 Supabase Session Pooler（通常 5432）；如果当前网络支持 IPv6，也可使用 Dashboard 提供的 direct 连接。必须按 Connect 弹窗中的真实地址填写。
- 设置 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`。Service Role Key 仅服务端使用，不可添加 `NEXT_PUBLIC_` 前缀。
- 确认目标数据库的 `public` schema 没有需保留的业务表/数据后，先执行 `npm.cmd run db:preflight:supabase`。该检查要求源库固定为本机 `ai`，且 `DATABASE_URL` 与 `DIRECT_URL` 都是 Supabase 地址；通过后再执行 `npm.cmd run db:push:supabase` 创建/对齐 schema，接着运行 `npm.cmd run db:check` 和 `npm.cmd run db:migrate:postgres`。
- 对比源/目标表行数和重点内容，核实产品、管理员、角色权限、CMS 页面、资源、下载版本及 `media_assets` 后，执行 Storage 初始化和资源迁移：

  ```powershell
  npm.cmd run storage:setup:supabase
  npm.cmd run storage:migrate:supabase
  npm.cmd run seed:employee-showcase
  npm.cmd run test:storage
  ```

迁移脚本会明确跳过本地旧表 `mysql_prisma_migrations_archive`（仅历史 MySQL 迁移归档，不属于 PostgreSQL 运行数据）；如果发现其他未映射的源表，会停止迁移，必须先确认是否需要纳入 Prisma Schema，而不是全局放行。

`LOCAL_UPLOAD_ROOT` 必须指向你真实的旧上传目录。如果媒体文件实际在其他盘符，请使用绝对路径。不要仅复制数据库链接而忽略文件本体。

## 4. 部署至 Vercel

本地完整测试：

```powershell
npm.cmd run build
npm.cmd run start
```

确认运行正常后，将代码推送到 GitHub，并在 Vercel 导入仓库。于 Vercel Project Settings > Environment Variables 配置运行时所需的 `DATABASE_URL`、`DIRECT_URL`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SUPABASE_STORAGE_BUCKET`、`ADMIN_SESSION_SECRET`、`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`STORAGE_SECRET`、`NEXT_PUBLIC_SITE_URL`。生产 `NEXT_PUBLIC_SITE_URL` 必须是实际 Vercel 域名或自定义域名。`.env` 不可提交 Git。

Vercel 部署通过后，测试公开页面、后台认证、CMS 保存、Logo 切换、图片上传/替换、公开资源访问和下载版本链接。设置 Vercel 环境变量时，不要配置 `LOCAL_SOURCE_DATABASE_URL`，它仅供本地一次性迁移；`SUPABASE_SERVICE_ROLE_KEY` 必须是服务器端变量，不能加 `NEXT_PUBLIC_` 前缀。切换完成前保留本地 PostgreSQL `ai` 作为回滚来源，不要删除本地数据。

## 5. 安全与范围

本地修复脚本只处理 Prisma 中声明为 enum 的列；它不会删除业务表，也不会重置数据库。它要求显式设置 `PG_ENUM_REPAIR_CONFIRM=ai`，并会对数据值做预检。整个云迁移过程需要真实 Supabase 凭据与本地运行结果，本说明没有声称已经替用户连接或修改真实 Supabase 项目。
