# 官网顶部 Logo 后台切换说明

## 后台入口

登录 CMS 后进入 **全站内容 → 导航与品牌**。页面顶部的「官网顶部 Logo」面板支持：

- 在素材库中选择已有图片，或直接上传新的 PNG/JPG/WebP/SVG；
- 在左侧深色预览卡中查看当前 Logo 与品牌文字；
- 点击「保存品牌 Logo」后写入 `SiteSetting.logo`，官网所有使用统一 `SiteHeader` 的页面都会读取该设置；
- 点击「恢复默认图标」并保存，可以取消自定义图片，恢复默认三线品牌标记。

也可以从旧入口 **网站设置 → 网站 Logo** 管理同一个字段。两个入口共享数据库中的 `SiteSetting.logo`，不会产生两份互相冲突的配置。

## 生效方式

保存后重新刷新官网页面即可看到最新 Logo。图片文件通过统一素材库上传/选择，数据库保存资源 URL；无需新增数据库表、无需 Prisma 迁移、无需重新导入数字员工截图。

## Windows PowerShell

若开发服务器正在运行，通常保存代码后 Next.js 会热更新；没有运行时执行：

```powershell
npm.cmd run dev
```

如项目首次安装依赖，再执行：

```powershell
npm.cmd ci
npm.cmd run prisma:generate
npm.cmd run dev
```

保留原有 `.env` 文件，不要用模板覆盖现有数据库配置。
