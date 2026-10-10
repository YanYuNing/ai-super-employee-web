# 全站 UI 科技感升级说明

## 设计方向
- 官网统一使用深海军蓝、亮蓝与蓝青色作为 AI 科技视觉主色。
- 首页 Hero 增加 CSS 轻量粒子点、柔和呼吸光效；不增加 Canvas/第三方动画依赖。
- 产品、方案、案例、资源及详情页统一卡片边框、悬停状态、层次阴影与焦点状态。
- 导航使用半透明玻璃效果与蓝青色悬停指示；按钮增加轻量高光扫过。
- 后台保留浅色可读工作台，只加强选中态、按钮与表面层次，避免深色主题影响日常编辑。
- 对 `prefers-reduced-motion` 用户关闭持续动画；触屏设备不触发悬停位移。

## 修改范围
- `app/globals.css`
- `app/admin/admin.css`

无数据库结构改动，无需运行 seed、迁移或重新导入媒体资源。

## Windows 启动
在项目根目录使用 PowerShell：

```powershell
npm.cmd run dev
```

生产构建验证建议执行：

```powershell
npm.cmd run build
```
