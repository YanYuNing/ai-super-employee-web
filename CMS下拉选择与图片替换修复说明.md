# CMS 产品归属 / 图片替换无法切换修复说明

## 问题原因

页面管理编辑器把正在修改的区块 JSON 暂存在 `dataText`，但 `app/admin/pages/page.tsx` 的 `normalizeSection()` 在每次 React 重渲染时只读后端原始 `data` 字段。用户选择新产品、图库图片或上传图片后，父组件状态更新会触发重渲染，旧 `data` 随即覆盖新 `dataText`，因此下拉框看起来无法切换。

## 本次修复

- 新增 `lib/cms-section-data.ts` 的 `readCmsSectionData()`，优先读取编辑器实时的 `dataText`，无实时内容时再读数据库 `data`。
- 「融合到产品卡片」选项的修改现在会跨 React 重渲染保留，手动解除产品关联也会保留。
- 数据库图库选图和 AssetPicker 上传/替换图片都会写回当前编辑状态，并显示当前预览。
- 上传图片后，新增图片会立即加入当前图库选择列表，无需刷新页面。
- 如果数据库图库尚未初始化，编辑器提供项目自带的 60 张截图作为备用选择；这时选中的图片 URL 和展示文案仍会写入 CMS 数据。首次部署仍建议执行 `npm.cmd run seed:employee-showcase`，将图片登记为正式媒体资产并放入配置的本地持久化目录或 OSS。
- 选择“不使用图片（纯文字）”会清空图片 URL 和资产 ID，前台回退为纯文字科技卡片。

## 部署

无需数据库迁移。替换源码后在 Windows PowerShell 项目根目录运行：

```powershell
npm.cmd run prisma:generate
npm.cmd run dev
```

如数据库尚未登记 60 张内置截图，并且已确认 `.env` 的数据库及文件存储配置正确，可以首次执行：

```powershell
npm.cmd run seed:employee-showcase
```

该导入命令不是日常启动步骤，不要每次启动都重复运行。
