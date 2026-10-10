import 'dotenv/config';
import { prisma } from '../lib/prisma';

const ABOUT_BODY = {
  kicker: 'ABOUT US',
  principlesKicker: 'WHY DIGITAL EMPLOYEE',
  principlesTitle: '从“工具集合”到“岗位协同”',
  principlesDescription: '把产品、Prompt、Skill 与 AI Claw 重新放回一条工作链路里，用户看到的是“谁在做什么”，而不只是“有什么功能”。',
  statsKicker: 'AI DIGITAL WORKFORCE / SNAPSHOT',
  statsStatus: '● LIVE',
  stats: [
    { value: 'AI', label: '核心技术方向', detail: '把多种 AI 能力组织成可执行岗位' },
    { value: '24/7', label: '工作方式', detail: '持续处理内容、获客、引流与服务任务' },
    { value: '10', label: '数字员工岗位', detail: '覆盖企业营销关键环节' },
    { value: '1→N', label: '协同方式', detail: '一个任务可调度多名数字员工协作' },
  ],
  principles: [
    { index: '01', title: '岗位化', text: '一个 AI 员工对应一个清晰职责，让能力更容易理解、调用与交接。' },
    { index: '02', title: '可调度', text: 'AI Claw 负责理解任务并调用对应数字员工，不要求用户记住复杂操作。' },
    { index: '03', title: '持续执行', text: '内容生成、获客、客服与销售跟进可以被拆成持续运行的任务。' },
    { index: '04', title: '可沉淀', text: 'Skills、Prompt、教程与行业资料统一沉淀到资源中心，持续复用。' },
  ],
};

const ABOUT_COPY = {
  title: '我们不是做更多 AI 工具，而是在做一支真正能工作的数字营销团队。',
  subtitle: '把分散的 AI 能力组织成岗位，让企业可以从“人找工具”转向“任务找能力”。',
  content: '围绕内容生产、品牌 IP、AI 获客、AI 引流、客户接待和销售跟进，我们用数字员工的方式重构企业营销执行链路。每个岗位都有职责、能力和任务入口，AI Claw 再把这些岗位连接起来，形成持续运行的数字工作流。',
};

const HOME_TASK = {
  status: 'EXECUTING',
  agent: 'AI Claw 3.0',
  title: '正在执行：装修行业关键词曝光任务',
  mode: '关键词曝光 · 自动执行',
  meta: '自动拆解任务',
  progress: 82,
};

async function main() {
  const about = await prisma.page.findUnique({ where: { slug: 'about' }, include: { sections: true } });
  if (about) {
    const body = about.sections.find((section: any) => section.sectionKey === 'body');
    if (body) {
      const current = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data as Record<string, unknown> : {};
      await prisma.pageSection.update({
        where: { id: body.id },
        data: {
          title: body.title || ABOUT_COPY.title,
          subtitle: body.subtitle || ABOUT_COPY.subtitle,
          content: body.content && !/^[01]{4,20}$/.test(body.content.trim()) ? body.content : ABOUT_COPY.content,
          data: { ...ABOUT_BODY, ...current, stats: Array.isArray(current.stats) && current.stats.length ? current.stats : ABOUT_BODY.stats, principles: Array.isArray(current.principles) && current.principles.length ? current.principles : ABOUT_BODY.principles },
        },
      });
      console.log('修复 about/body：完成');
    }
  }

  const home = await prisma.page.findUnique({ where: { slug: 'home' }, include: { sections: true } });
  if (home) {
    const hero = home.sections.find((section: any) => section.sectionKey === 'hero');
    if (hero) {
      const current = hero.data && typeof hero.data === 'object' && !Array.isArray(hero.data) ? hero.data as Record<string, unknown> : {};
      const currentTask = current.task && typeof current.task === 'object' && !Array.isArray(current.task) ? current.task as Record<string, unknown> : {};
      await prisma.pageSection.update({
        where: { id: hero.id },
        data: { data: { ...current, task: { ...HOME_TASK, ...currentTask }, floatingStatuses: Array.isArray(current.floatingStatuses) && current.floatingStatuses.length ? current.floatingStatuses : ['内容生成中', '关键词策略已生成', '正在接待客户'] } },
      });
      console.log('修复 home/hero：任务卡动态字段完成');
    }
  }

  const siteHome = await prisma.homeConfig.findUnique({ where: { key: 'site.home' } });
  let homeCopy: Record<string, unknown> = {};
  if (siteHome?.value) {
    try { homeCopy = JSON.parse(siteHome.value); } catch { homeCopy = {}; }
  }
  const mergedHome = {
    heroTaskStatus: homeCopy.heroTaskStatus || HOME_TASK.status,
    heroTaskAgent: homeCopy.heroTaskAgent || HOME_TASK.agent,
    heroTaskTitle: homeCopy.heroTaskTitle || HOME_TASK.title,
    heroTaskMeta: homeCopy.heroTaskMeta || HOME_TASK.meta,
    heroTaskProgress: homeCopy.heroTaskProgress || String(HOME_TASK.progress),
    heroTaskMode: homeCopy.heroTaskMode || HOME_TASK.mode,
  };
  await prisma.homeConfig.upsert({ where: { key: 'site.home' }, update: { value: JSON.stringify({ ...homeCopy, ...mergedHome }), status: true }, create: { key: 'site.home', value: JSON.stringify(mergedHome), status: true } });
  console.log('修复 site.home：任务卡文案完成');
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
