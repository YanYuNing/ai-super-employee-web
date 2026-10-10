export type PermissionCatalogItem = {
  code: string;
  name: string;
  group: string;
  groupName: string;
  description: string;
  action: string;
};

export const PERMISSION_CATALOG: PermissionCatalogItem[] = [
  { code: 'dashboard.view', name: '查看工作台', group: 'dashboard', groupName: '工作台', description: '进入后台运营工作台并查看统计信息', action: '查看' },

  { code: 'home.view', name: '查看首页', group: 'home', groupName: '首页管理', description: '查看官网首页配置与区块', action: '查看' },
  { code: 'home.edit', name: '编辑首页', group: 'home', groupName: '首页管理', description: '新增、修改、排序、启停首页区块', action: '编辑' },

  { code: 'product.view', name: '查看产品', group: 'product', groupName: '产品管理', description: '查看 AI 产品内容', action: '查看' },
  { code: 'product.create', name: '新增产品', group: 'product', groupName: '产品管理', description: '创建 AI 产品', action: '新增' },
  { code: 'product.edit', name: '编辑产品', group: 'product', groupName: '产品管理', description: '修改产品内容、SEO 与展示配置', action: '编辑' },
  { code: 'product.delete', name: '删除产品', group: 'product', groupName: '产品管理', description: '删除产品及相关内容', action: '删除' },
  { code: 'product.publish', name: '发布产品', group: 'product', groupName: '产品管理', description: '控制产品上线与展示状态', action: '发布' },

  { code: 'skill.view', name: '查看 Skill', group: 'skill', groupName: 'Skill 管理', description: '查看 Skill、版本与说明', action: '查看' },
  { code: 'skill.create', name: '新增 Skill', group: 'skill', groupName: 'Skill 管理', description: '创建 Skill', action: '新增' },
  { code: 'skill.edit', name: '编辑 Skill', group: 'skill', groupName: 'Skill 管理', description: '修改 Skill 内容与配置', action: '编辑' },
  { code: 'skill.delete', name: '删除 Skill', group: 'skill', groupName: 'Skill 管理', description: '删除 Skill', action: '删除' },
  { code: 'skill.upload', name: '上传 Skill 版本', group: 'skill', groupName: 'Skill 管理', description: '上传 Skill ZIP 或版本文件', action: '上传' },

  { code: 'prompt.view', name: '查看 Prompt', group: 'prompt', groupName: 'Prompt 管理', description: '查看 Prompt 与分类', action: '查看' },
  { code: 'prompt.create', name: '新增 Prompt', group: 'prompt', groupName: 'Prompt 管理', description: '创建 Prompt', action: '新增' },
  { code: 'prompt.edit', name: '编辑 Prompt', group: 'prompt', groupName: 'Prompt 管理', description: '修改 Prompt 内容与配置', action: '编辑' },
  { code: 'prompt.delete', name: '删除 Prompt', group: 'prompt', groupName: 'Prompt 管理', description: '删除 Prompt', action: '删除' },
  { code: 'prompt.upload', name: '上传 Prompt 文件', group: 'prompt', groupName: 'Prompt 管理', description: '上传 Prompt 文件附件', action: '上传' },

  { code: 'file.view', name: '查看文件', group: 'file', groupName: '文件资产', description: '查看文件资产、预览与元数据', action: '查看' },
  { code: 'file.upload', name: '上传文件', group: 'file', groupName: '文件资产', description: '上传图片、视频、文档、ZIP 等文件', action: '上传' },
  { code: 'file.download', name: '下载文件', group: 'file', groupName: '文件资产', description: '下载或复制文件地址', action: '下载' },
  { code: 'file.delete', name: '删除文件', group: 'file', groupName: '文件资产', description: '删除媒体资产', action: '删除' },
  { code: 'file.manage', name: '管理文件', group: 'file', groupName: '文件资产', description: '移动、整理、修改文件元数据', action: '管理' },

  { code: 'storage.view', name: '查看存储配置', group: 'storage', groupName: '文件存储', description: '查看本地、OSS、CDN 存储配置', action: '查看' },
  { code: 'storage.edit', name: '编辑存储配置', group: 'storage', groupName: '文件存储', description: '修改对象存储、CDN 与上传策略', action: '编辑' },

  { code: 'download.view', name: '查看下载', group: 'download', groupName: '下载管理', description: '查看产品下载项与版本', action: '查看' },
  { code: 'download.create', name: '新增下载', group: 'download', groupName: '下载管理', description: '新增下载产品', action: '新增' },
  { code: 'download.edit', name: '编辑下载', group: 'download', groupName: '下载管理', description: '修改下载项、版本与地址', action: '编辑' },
  { code: 'download.delete', name: '删除下载', group: 'download', groupName: '下载管理', description: '删除下载项', action: '删除' },

  { code: 'content.view', name: '查看内容', group: 'content', groupName: '内容中心', description: '查看解决方案、案例、资源、教程、文章、FAQ、日志、页面等', action: '查看' },
  { code: 'content.create', name: '新增内容', group: 'content', groupName: '内容中心', description: '创建官网内容记录', action: '新增' },
  { code: 'content.edit', name: '编辑内容', group: 'content', groupName: '内容中心', description: '修改官网内容记录', action: '编辑' },
  { code: 'content.delete', name: '删除内容', group: 'content', groupName: '内容中心', description: '删除官网内容记录', action: '删除' },
  { code: 'content.publish', name: '发布内容', group: 'content', groupName: '内容中心', description: '控制内容发布、下线与状态', action: '发布' },

  { code: 'page.view', name: '查看页面', group: 'page', groupName: '页面管理', description: '查看官网页面内容、区块与 SEO 配置', action: '查看' },
  { code: 'page.edit', name: '编辑页面', group: 'page', groupName: '页面管理', description: '修改官网页面、区块与前台动态文案', action: '编辑' },
  { code: 'page.publish', name: '发布页面', group: 'page', groupName: '页面管理', description: '控制官网页面草稿、发布与归档状态', action: '发布' },

  { code: 'lead.view', name: '查看线索', group: 'lead', groupName: '销售线索', description: '查看客户线索及联系方式', action: '查看' },
  { code: 'lead.edit', name: '编辑线索', group: 'lead', groupName: '销售线索', description: '分配、跟进、修改与删除线索', action: '编辑' },
  { code: 'lead.delete', name: '删除线索', group: 'lead', groupName: '销售线索', description: '删除销售线索', action: '删除' },

  { code: 'settings.view', name: '查看网站设置', group: 'settings', groupName: '网站设置', description: '查看品牌、联系、SEO 等设置', action: '查看' },
  { code: 'settings.edit', name: '编辑网站设置', group: 'settings', groupName: '网站设置', description: '修改品牌、联系、SEO 与下载配置', action: '编辑' },

  { code: 'admin.view', name: '查看管理员', group: 'admin', groupName: '管理员', description: '查看后台管理员账号', action: '查看' },
  { code: 'admin.create', name: '新增管理员', group: 'admin', groupName: '管理员', description: '创建后台管理员并分配角色', action: '新增' },
  { code: 'admin.edit', name: '编辑管理员', group: 'admin', groupName: '管理员', description: '修改管理员资料、状态、密码与角色', action: '编辑' },
  { code: 'admin.delete', name: '删除管理员', group: 'admin', groupName: '管理员', description: '删除后台管理员账号', action: '删除' },

  { code: 'role.view', name: '查看角色', group: 'role', groupName: '角色与权限', description: '查看角色与权限矩阵', action: '查看' },
  { code: 'role.create', name: '新增角色', group: 'role', groupName: '角色与权限', description: '创建自定义角色', action: '新增' },
  { code: 'role.edit', name: '编辑角色', group: 'role', groupName: '角色与权限', description: '修改角色名称、说明与权限', action: '编辑' },
  { code: 'role.delete', name: '删除角色', group: 'role', groupName: '角色与权限', description: '删除自定义角色', action: '删除' },
];

export const PERMISSION_GROUPS = Array.from(new Set(PERMISSION_CATALOG.map((x) => x.group))).map((group) => {
  const first = PERMISSION_CATALOG.find((x) => x.group === group)!;
  return { key: group, name: first.groupName };
});

export const DEFAULT_ROLE_PRESETS: Record<string, string[]> = {
  内容编辑: PERMISSION_CATALOG.filter((x) => /^(dashboard|home|product|skill|prompt|content|download|lead|page)\./.test(x.code)).map((x) => x.code),
  文件管理员: PERMISSION_CATALOG.filter((x) => /^(dashboard|file|storage)\./.test(x.code) || ['skill.upload', 'prompt.upload'].includes(x.code)).map((x) => x.code),
  运营人员: PERMISSION_CATALOG.filter((x) => /^(dashboard|home\.view|product\.view|skill\.view|prompt\.view|content\.view|download\.view|lead\.)/.test(x.code)).map((x) => x.code),
};
