export type EmployeeShowcaseItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAssetId?: number | null;
  imageAlt?: string;
  productSlug?: string;
  productSlugUnlinked?: boolean;
  href?: string;
  enabled?: boolean;
};

const LEGACY_SCENE_PRODUCT: Record<string, string> = {
  'video-workflow': 'ai-video',
  'image-creation': 'ai-image',
  'geo-acquisition': 'geo',
  'workflow-automation': 'ai-lead',
  'operations-overview': 'ai-lead',
  'platform-accounts': 'ai-lead',
  'video-template': 'ai-mix',
  'geo-report': 'geo',
  'agent-library': 'ip-agent',
};

/** Resolve legacy showcase items that predate productSlug, including records saved with an empty string. */
export function getEmployeeShowcaseProductSlug(scene: Partial<EmployeeShowcaseItem> & { productSlugUnlinked?: boolean }): string {
  if (scene.productSlugUnlinked === true) return '';
  const explicitSlug = String(scene.productSlug || '').trim();
  if (explicitSlug) return explicitSlug;
  const id = String(scene.id || '').trim();
  if (LEGACY_SCENE_PRODUCT[id]) return LEGACY_SCENE_PRODUCT[id];
  const hrefMatch = String(scene.href || '').match(/^\/products\/([^/?#]+)/i);
  if (hrefMatch?.[1]) return hrefMatch[1];

  const text = `${scene.category || ''} ${scene.title || ''} ${scene.description || ''}`.toLowerCase();
  if (/企业微信|企业客服|wecom/.test(text)) return 'wecom-customer-service';
  if (/微信客服|公众号客服|wechat/.test(text)) return 'wechat-customer-service';
  if (/抖音客服|douyin/.test(text)) return 'douyin-customer-service';
  if (/混剪|剪辑|视频模板|字幕样式/.test(text)) return 'ai-mix';
  if (/生图|图片生成|视觉素材|画面比例|image creation/.test(text)) return 'ai-image';
  if (/短视频|视频生成|视频创作|视频工作流|成片|文案到成片|video workflow/.test(text)) return 'ai-video';
  if (/geo|关键词.*曝光|大模型平台|搜索收录|智能获客/.test(text)) return 'geo';
  if (/ip智能体|ip运营|专业智能体|数字人/.test(text)) return 'ip-agent';
  if (/引流|线索|客户增长|运营数据|自动化|工作流|任务执行/.test(text)) return 'ai-lead';
  return '';
}

export const DEFAULT_EMPLOYEE_SHOWCASE_ITEMS: EmployeeShowcaseItem[] = [
  {
    id: 'video-workflow', productSlug: 'ai-video', category: '内容生产 / AI短视频', title: '从文案到成片的一体化创作',
    description: '串联文案提取、数字人选择、语音设置与成片模板，让内容生产流程更清晰。',
    imageUrl: '/employee-showcase/24.webp', imageAlt: 'AI数字员工短视频创作流程界面', href: '/products/ai-video', enabled: true,
  },
  {
    id: 'image-creation', productSlug: 'ai-image', category: '视觉创作 / AI生图', title: '把创意快速变成视觉素材',
    description: '展示文字生成图片、选择画面比例与生成记录等创作环节，适配不同内容场景。',
    imageUrl: '/employee-showcase/20.webp', imageAlt: 'AI数字员工图片生成界面', href: '/products/ai-image', enabled: true,
  },
  {
    id: 'geo-acquisition', productSlug: 'geo', category: '智能获客 / GEO', title: '围绕目标关键词持续拓展曝光',
    description: '将大模型平台、关键词与内容收录环节集中管理，形成更完整的获客工作链路。',
    imageUrl: '/employee-showcase/33.webp', imageAlt: 'GEO获客大模型平台管理界面', href: '/products/geo', enabled: true,
  },
  {
    id: 'workflow-automation', productSlug: 'ai-lead', category: '任务执行 / 自动化', title: '让营销动作按计划持续推进',
    description: '将关键词曝光、定向曝光与主动激活等动作组织为可配置的工作流程。',
    imageUrl: '/employee-showcase/09.webp', imageAlt: 'AI数字员工工作流与定时任务界面', href: '/ai-claw', enabled: true,
  },
  {
    id: 'operations-overview', productSlug: 'ai-lead', category: '运营数据 / 效果追踪', title: '在同一视图查看关键运营数据',
    description: '把接待、消息、转化与内容动作汇总展示，帮助团队持续观察运营过程。',
    imageUrl: '/employee-showcase/08.webp', imageAlt: 'AI数字员工运营数据总览界面', href: '/ai-claw', enabled: true,
  },
  {
    id: 'platform-accounts', productSlug: 'ai-lead', category: '多平台运营', title: '统一管理不同平台的账号资产',
    description: '集中查看平台账号、授权状态与同步入口，为跨平台内容运营提供基础。',
    imageUrl: '/employee-showcase/18.webp', imageAlt: 'AI数字员工多平台账号管理界面', href: '/products/ai-lead', enabled: true,
  },
  {
    id: 'video-template', productSlug: 'ai-mix', category: '创作编排 / 模板', title: '细化视频标题、字幕与模板样式',
    description: '通过可视化编辑组织标题层级、位置、样式和预览，保持内容表达的一致性。',
    imageUrl: '/employee-showcase/23.webp', imageAlt: 'AI短视频模板样式编辑界面', href: '/products/ai-video', enabled: true,
  },
  {
    id: 'geo-report', productSlug: 'geo', category: '智能获客 / 数据分析', title: '持续跟踪关键词与内容表现',
    description: '通过关键词、创作和收录等维度查看数据概况，为后续内容调整提供参考。',
    imageUrl: '/employee-showcase/34.webp', imageAlt: 'GEO关键词与收录报告界面', href: '/products/geo', enabled: true,
  },
  {
    id: 'agent-library', productSlug: 'ip-agent', category: '岗位协作 / 智能体', title: '不同专业智能体协同完成任务',
    description: '按引流、销售、营销与客服等方向组织专业智能体，让岗位职责更直观。',
    imageUrl: '/employee-showcase/60.webp', imageAlt: 'AI数字员工智能体目录界面', href: '/ai-claw', enabled: true,
  },
];

const curatedGalleryLabels: Record<number, string> = {
  1: '首页 / 任务入口', 2: '任务设置 / 选项弹窗', 3: 'AI任务创建', 4: '基础设置表单', 5: 'AI能力配置',
  6: '任务完成状态', 7: '提示与状态反馈', 8: '运营数据总览', 9: '自动化工作流与曝光任务', 10: '账号任务 / 主动激活',
  11: '视频生成表单', 12: '视频生成参数', 13: '短视频创作工作区', 14: '短视频创作设置', 15: '创作步骤设置',
  16: '创作流程配置', 17: '创作高级参数', 18: '多平台账号统一管理', 19: '素材 / 角色设置', 20: 'AI生图与生成记录',
  21: 'AI生图工作区', 22: '生成素材预览', 23: '短视频模板样式编辑', 24: '从文案到成片的创作流程', 25: 'IP内容生产配置',
  26: '数字人及模板选择', 27: 'IP视频创作参数', 28: '视频素材选择', 29: '数字人资源管理', 30: '素材选择弹窗',
  31: 'GEO任务编辑', 32: 'GEO模块入口', 33: 'GEO大模型平台管理', 34: 'GEO关键词与效果报表', 35: '资源选择弹窗',
  36: '素材资源选择', 37: 'GEO配置表单', 38: '媒体素材选择', 39: '内容发布设置', 40: '媒体平台账号添加',
  41: '任务列表与状态', 42: '运营任务概览', 43: '自动化任务配置', 44: '流程任务编辑', 45: '任务详情',
  46: '自动化执行配置', 47: '内容发布任务', 48: '任务执行面板', 49: '流程编辑弹窗', 50: '流程节点设置',
  51: '任务参数设置', 52: '执行任务配置', 53: '素材及发布参数', 54: '任务执行工作区', 55: '智能体任务配置',
  56: '任务工作流设置', 57: 'AI执行参数', 58: '内容任务列表', 59: '发布与获客任务', 60: '专业智能体目录',
};

export const EMPLOYEE_SHOWCASE_GALLERY = Array.from({ length: 60 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    src: `/employee-showcase/${String(number).padStart(2, '0')}.webp`,
    label: `${String(number).padStart(2, '0')} · ${curatedGalleryLabels[number] || `操作界面截图 ${String(number).padStart(2, '0')}`}`,
  };
});

export const DEFAULT_EMPLOYEE_SHOWCASE_SECTION = {
  sectionKey: 'showcase',
  title: '看看 AI 数字员工如何工作',
  subtitle: '从内容创作到智能获客，透过真实操作界面，直观了解数字员工如何把岗位能力转化为可执行的工作流程。',
  content: null,
  imageUrl: null,
  videoUrl: null,
  sortOrder: 5,
  enabled: true,
  data: {
    kicker: 'INSIDE THE AI WORKFORCE',
    button: { text: '了解数字员工能力', url: '/products' },
    items: DEFAULT_EMPLOYEE_SHOWCASE_ITEMS,
  },
};
