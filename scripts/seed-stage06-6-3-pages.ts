import 'dotenv/config';
import { prisma } from '../lib/prisma';

type PageDef = {
  slug: string;
  title: string;
  description: string;
  sections: Array<{
    sectionKey: string;
    title?: string;
    subtitle?: string;
    content?: string;
    data?: Record<string, unknown>;
    sortOrder: number;
  }>;
};

const pages: PageDef[] = [
  {
    slug: 'about',
    title: '关于豫辉 AI超级员工',
    description: '用AI重构企业营销的内容、获客、引流、销售与客服流程。',
    sections: [
      { sectionKey: 'hero', title: '关于豫辉 AI超级员工', subtitle: '用AI重构企业营销的内容、获客、引流、销售与客服流程。', data: { kicker: 'ABOUT', button: { text: '预约演示', url: '/contact' } }, sortOrder: 10 },
      { sectionKey: 'body', title: '我们不是做更多 AI 工具，而是在做一支真正能工作的数字营销团队。', subtitle: '把分散的 AI 能力组织成岗位，让企业可以从“人找工具”转向“任务找能力”。', content: '围绕内容生产、品牌 IP、AI 获客、AI 引流、客户接待和销售跟进，我们用数字员工的方式重构企业营销执行链路。每个岗位都有职责、能力和任务入口，AI Claw 再把这些岗位连接起来，形成持续运行的数字工作流。', data: { kicker: 'ABOUT US', principlesKicker: 'WHY DIGITAL EMPLOYEE', principlesTitle: '从“工具集合”到“岗位协同”', principlesDescription: '把产品、Prompt、Skill 与 AI Claw 重新放回一条工作链路里，用户看到的是“谁在做什么”，而不只是“有什么功能”。', statsKicker: 'AI DIGITAL WORKFORCE / SNAPSHOT', statsStatus: '● LIVE', stats: [{ value: 'AI', label: '核心技术方向', detail: '把多种 AI 能力组织成可执行岗位' }, { value: '24/7', label: '工作方式', detail: '持续处理内容、获客、引流与服务任务' }, { value: '10', label: '数字员工岗位', detail: '覆盖企业营销关键环节' }, { value: '1→N', label: '协同方式', detail: '一个任务可调度多名数字员工协作' }], principles: [{ index: '01', title: '岗位化', text: '一个 AI 员工对应一个清晰职责，让能力更容易理解、调用与交接。' }, { index: '02', title: '可调度', text: 'AI Claw 负责理解任务并调用对应数字员工，不要求用户记住复杂操作。' }, { index: '03', title: '持续执行', text: '内容生成、获客、客服与销售跟进可以被拆成持续运行的任务。' }, { index: '04', title: '可沉淀', text: 'Skills、Prompt、教程与行业资料统一沉淀到资源中心，持续复用。' }] }, sortOrder: 20 },
    ],
  },
  {
    slug: 'contact',
    title: '预约 AI 超级员工演示',
    description: '告诉我们你的行业、业务场景和当前需求，我们会根据实际情况安排演示与沟通。',
    sections: [
      { sectionKey: 'hero', title: '预约 AI 超级员工演示', subtitle: '告诉我们你的行业、业务场景和当前需求，我们会根据实际情况安排演示与沟通。', data: { kicker: 'CONTACT', secondary: { text: '先看看产品', url: '/products' } }, sortOrder: 10 },
      { sectionKey: 'intro', title: '让AI真正进入你的营销流程', subtitle: '从内容生产、AI获客、引流，到客服与销售跟进，现场了解9大AI超级员工如何协同工作。', data: { kicker: 'DEMO' }, sortOrder: 20 },
      { sectionKey: 'steps', data: { items: ['业务场景梳理', '产品能力演示', '部署方式沟通'] }, sortOrder: 30 },
    ],
  },
  {
    slug: 'ai-claw',
    title: '从“被动执行”到“主动思考”',
    description: '你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。',
    sections: [
      { sectionKey: 'hero', title: '从“被动执行”到“主动思考”', subtitle: '你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。', data: { kicker: 'AI CLAW 3.0', command: '我是做装修行业的，帮我创建一个关键词曝光任务', primary: { text: '预约演示', url: '/contact' }, secondary: { text: '查看9大AI员工', url: '/products' } }, sortOrder: 10 },
      { sectionKey: 'process', title: '一句话下达任务，AI自己完成后面的工作', subtitle: 'AI理解目标后，自动调用对应能力，不需要记复杂操作流程。', data: { kicker: 'COMMAND CENTER', consoleTitle: 'AI CLAW COMMAND CENTER', consoleStatus: 'ONLINE', items: [{ number: '01', title: '理解任务', desc: '识别行业、目标与任务要求' }, { number: '02', title: '自动拆解', desc: '生成执行步骤与策略' }, { number: '03', title: '调用AI能力', desc: '调度对应AI超级员工协同工作' }, { number: '04', title: '持续执行', desc: '任务创建后持续推进并反馈' }] }, sortOrder: 20 },
      { sectionKey: 'examples', title: '支持自然语言下达营销任务', data: { kicker: 'EXAMPLES', items: ['我是做装修行业的，帮我创建一个关键词曝光任务', '帮我生成一条 IP 智能体视频', '帮我发布一下短视频'] }, sortOrder: 30 },
      { sectionKey: 'workforce', title: '9大AI超级员工统一协同', subtitle: 'AI Claw是统一的智能操作中心，负责把目标拆解为可执行任务。', data: { kicker: 'AI WORKFORCE', items: [{ title: '理解', text: '识别行业、目标与任务上下文。' }, { title: '拆解', text: '把自然语言转换成清晰的执行步骤。' }, { title: '调度', text: '调用内容、获客、引流、客服等AI员工。' }, { title: '执行', text: '持续推动任务并反馈执行结果。' }] }, sortOrder: 40 },
    ],
  },
  {
    slug: 'products',
    title: '9大AI超级员工',
    description: '从内容生产、品牌IP、AI获客，到客户接待与销售跟进，覆盖企业营销关键环节。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'AI WORKFORCE' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { tag: 'AI员工', ctaText: '查看能力 →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '后台暂未发布产品。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'AI EMPLOYEE', primary: { text: '预约演示', url: '/contact' }, secondary: { text: '返回产品中心', url: '/products' }, capabilitiesKicker: 'CAPABILITIES', capabilitiesTitle: '核心能力', emptyContent: '产品能力正在由后台内容中心持续完善。', contentTitle: '产品介绍' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'solutions',
    title: '行业解决方案',
    description: '根据企业业务场景组合AI能力，从内容生产到获客、引流、销售与客户服务。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'SOLUTIONS' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { tag: '行业方案', description: '查看完整方案', ctaText: '查看方案 →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '后台暂未发布解决方案。发布后前台会自动同步。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'SOLUTION', primary: { text: '咨询方案', url: '/contact' }, emptyContent: '该方案的详细内容正在持续完善。' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'cases',
    title: '客户案例',
    description: '案例内容由后台统一维护，发布后首页与案例中心自动同步。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'CASES' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { tag: '企业案例', description: '查看案例详情' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '后台暂未发布客户案例。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'CASE STUDY', primary: { text: '咨询类似方案', url: '/contact' }, emptyContent: '案例详情正在持续完善。' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'resources',
    title: '资源中心',
    description: 'Skills、Prompt、教程、工具与产品资料，统一从 CMS 发布与维护。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'RESOURCE CENTER' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { resourceLabel: '资源', resourceCta: '查看资源 →', skillLabel: 'SKILL', skillCta: '查看 Skill →', promptLabel: 'PROMPT', promptCta: '查看 Prompt →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '后台暂未发布资源。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'RESOURCE', emptyContent: '资源内容正在持续完善。' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'skills',
    title: 'Skills 技能中心',
    description: '沉淀可复用的 AI 工作能力，让能力可以被持续调用、复用与迭代。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'SKILLS' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { versionPrefix: 'SKILL', description: '暂无简介', ctaText: '查看技能 →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '暂未发布 Skill，可在 CMS 后台进行发布。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'SKILL', descriptionFallback: '可复用的 AI 工作能力。', primary: { text: '了解部署', url: '/contact' }, secondary: { text: '返回 Skills', url: '/skills' }, contentTitle: '技能说明', versionsTitle: '版本记录', latestText: '最新', versionEmptyText: '暂无更新说明', downloadText: '下载' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'prompts',
    title: 'Prompt 提示词中心',
    description: '把已经验证过的任务表达方式沉淀下来，让 AI 工作流更容易复用。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'PROMPTS' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { label: 'PROMPT', modelFallback: '通用模型', description: '官方提示词模板', ctaText: '查看 Prompt →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '暂未发布 Prompt，可在 CMS 后台进行发布。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'PROMPT', descriptionFallback: '官方提示词模板。', secondary: { text: '返回 Prompt', url: '/prompts' }, contentTitle: '提示词内容', modelFallback: '通用模型', emptyContent: '暂无内容', usageTitle: '使用方法' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'docs',
    title: '使用教程',
    description: '产品操作、AI Claw 与各个 AI 超级员工的教程，由 CMS 后台统一发布。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'DOCS / TUTORIALS' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { label: '教程', ctaText: '查看教程 →' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '后台暂未发布教程。进入 CMS → 内容中心 → 教程，即可发布。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'TUTORIAL', emptyContent: '教程内容正在完善。' }, sortOrder: 40 },
    ],
  },
  {
    slug: 'downloads',
    title: '产品下载中心',
    description: '客户端、Skill、模板与产品资源统一从 CMS 发布与维护。',
    sections: [
      { sectionKey: 'hero', data: { kicker: 'DOWNLOADS' }, sortOrder: 10 },
      { sectionKey: 'cards', data: { platformFallback: '通用', versionFallback: '暂无版本', description: '产品下载资源', downloadText: '立即下载', codePrefix: '提取码' }, sortOrder: 20 },
      { sectionKey: 'empty', data: { text: '暂无可下载内容。可在 CMS 后台进入下载管理发布版本。' }, sortOrder: 30 },
      { sectionKey: 'detail', data: { kicker: 'DOWNLOADS' }, sortOrder: 40 },
    ],
  },
];

async function ensurePage(def: PageDef) {
  const page = await prisma.page.upsert({
    where: { slug: def.slug },
    update: {},
    create: { slug: def.slug, title: def.title, description: def.description, status: 'PUBLISHED', sortOrder: 0 },
  });

  for (const section of def.sections) {
    const existing = await prisma.pageSection.findUnique({ where: { pageId_sectionKey: { pageId: page.id, sectionKey: section.sectionKey } } });
    if (existing) continue;
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        sectionKey: section.sectionKey,
        title: section.title ?? null,
        subtitle: section.subtitle ?? null,
        content: section.content ?? null,
        data: section.data ? JSON.parse(JSON.stringify(section.data)) : undefined,
        sortOrder: section.sortOrder,
        enabled: true,
      },
    });
  }
}

async function main() {
  for (const page of pages) await ensurePage(page);
  console.log(`06.6.3 页面 CMS 默认结构初始化完成，共 ${pages.length} 个页面。`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
