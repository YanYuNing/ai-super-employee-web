# 后台管理 ↔ 用户端最终审计（阶段 06.15）

本轮按“后台字段必须有用户端消费者，否则隐藏/清理”的原则复核后台管理与官网。

## 处理结果

### 已隐藏 / 清理的冗余内容

- 资源中心：`resources/hero`、`resources/cards`、`resources/empty`
- 下载中心：`downloads/detail`
- 联系我们：`contact/form`
- 首页页面级 `content / coverImage`
- 关于我们页面级 `content / coverImage`
- 联系我们页面级 `content / coverImage`
- `site.common`
- 网站设置旧字段：`address / downloadUrl / socialLinks`
- 首页旧平铺任务字段：`heroTask* / heroFloating*`
- 首页 `ai-employees.items` 重复员工列表（前台以 Product 表为唯一员工来源）
- Skill 下载量、Prompt 复制量不再出现在当前管理 UI

### 已补齐的用户端消费者

- 首页 Hero 执行卡：状态、执行引擎、任务、模式、进度、浮动状态全部读取 `home/hero.data`
- About：正文、指标、价值原则从 `about/body` 读取
- 首页自定义扩展区块：正文、图片、视频、按钮、items 均可被用户端渲染
- 资源中心：统一由 `resource-hub` 驱动 5 类资源入口
- 下载中心：版本记录直接进入下载，不再保留无消费者的详情区块

### 后台 UI 结构

- 页面管理只显示系统页面真实消费的字段
- 系统区块不再提供没有前台消费者的通用正文、图片、视频
- 自定义扩展区块继续提供正文、图片、视频，并由公共扩展渲染器直接展示到用户端
- 每个页面支持“预览当前页面”
- 资源中心编排后台带前台导航实时预览

## 一次性数据库清理

首次部署建议运行：

```bash
npm run repair:stage06.15
```

该脚本会删除/清理历史冗余配置，但不会删除业务主数据。

## 验收顺序

1. `/admin/pages`：切换首页、关于我们、联系我们、资源中心、下载中心，确认不再出现已隐藏的冗余区块。
2. `/admin/home-config`：编辑 Hero 执行卡，保存后打开官网确认任务文字和进度同步。
3. `/admin/site-content`：修改首页固定文案、导航、页脚，刷新官网确认同步。
4. `/admin/resource-hub`：调整 5 个资源模块顺序/显示，确认首页和 `/resources` 同步。
5. `/admin/cms/tutorials`、`resources`、`articles` 等：编辑后确认对应用户端列表/详情页面实际变化。
6. `/admin/files`：上传视频，进入资源详情确认在线播放；视频优先使用 MP4（H.264/AAC）。
