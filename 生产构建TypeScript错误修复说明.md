# 生产构建 TypeScript 错误修复说明

本次基于 Supabase Storage 初始化与生产构建修复版继续修复 `npm.cmd run build` 的 TypeScript 检查错误。

## 修复项目

1. `app/api/admin/settings/route.ts`
   - Prisma Nullable Json 字段 `socialLinks` 不再传普通 `null`。
   - 改用 `Prisma.DbNull` 表示数据库 NULL，满足 Prisma 7 的输入类型。

2. `app/products/[slug]/page.tsx`
   - 为产品 feature、显示标签和索引参数增加明确类型，修复 implicit any。

3. `components/admin/page-data-fields.tsx`
   - 为 `stats` 与 `principles` 的数组检查 callback 参数标注 `unknown`，保留原有运行时校验。

4. `scripts/repair-stage06-14-admin-public-audit.ts` 与 `scripts/repair-stage06-15-admin-public-audit.ts`
   - 同步把可空 Json 字段的数据库空值改为 `Prisma.DbNull`。

## 数据安全

本修复仅改 TypeScript 类型和 Prisma JSON 空值表达，不修改 Prisma Schema，不执行数据库写入，也不要求重跑数据迁移。

## 本地验证

在项目根目录执行：

```powershell
npm.cmd run prisma:generate
npm.cmd run build
```

本次工作沙箱安装依赖超时，因此没有声称完整生产构建已通过。若构建出现新的 TypeScript 错误，应逐条修复后再发布。
