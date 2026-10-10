# PostgreSQL 枚举类型缺失修复说明

## 当前情况

本地项目使用 PostgreSQL 数据库 `ai`，其中已有业务表和数据。报错：

```text
Database error. Code: 42704. Message: 类型 "public.SkillStatus" 不存在
```

表示 Prisma Schema 已声明 `SkillStatus` 枚举，但 PostgreSQL `public` schema 缺少此类型，或状态列还是 text/varchar。请不要为了修此错误清空数据库，也不要对现有 `ai` 库盲目运行 `prisma db push`。

## 修复前

1. 在 Navicat 里对 PostgreSQL 数据库 `ai` 做完整备份。
2. 确认项目根目录 `.env` 中 `DATABASE_URL` 与 `DIRECT_URL` 都指向本地 `ai`。
3. 不要在聊天或 Git 中分享包含密码的 `.env`。

## 执行修复

首次安装依赖时先执行 `npm.cmd install`。然后在 Windows PowerShell 项目根目录执行：

```powershell
npm.cmd run prisma:generate
$env:PG_ENUM_REPAIR_CONFIRM = "ai"
npm.cmd run db:repair:postgres-enums
Remove-Item Env:PG_ENUM_REPAIR_CONFIRM
npm.cmd run db:check
npm.cmd run dev
```

修复脚本会：

- 检查实际连接的数据库名必须是 `ai`，并要求显式确认；
- 预先检查所有枚举字段当前的数据值；
- 如数据包含 Prisma Schema 不允许的枚举值，在修改前停止；
- 在事务中创建缺失枚举类型，并把已存在的状态列转换成对应枚举类型；
- 保留业务行，不删除产品、资源、用户、权限、CMS 内容或媒体记录；
- 发生异常时回滚本次 DDL 修改。

如果脚本提示历史值不合法或字段缺失，请保留完整日志，不要执行清库、重置或覆盖命令。应先确认实际字段/数据与当前 Prisma Schema 是否一致。

## 重要

当前项目实际运行应继续使用本地 PostgreSQL `ai`。迁移到 Supabase 之前，不需要使用 `ai_migration_test`。只有准备迁往 Supabase 时，才将 `DATABASE_URL` / `DIRECT_URL` 改为 Supabase 目标地址，并保留 `LOCAL_SOURCE_DATABASE_URL` 指向本地 `ai` 作为只读源库。
