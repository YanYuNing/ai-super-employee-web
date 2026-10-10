import { prisma } from '../lib/prisma';

const sections = [
  { key: 'manual', title: '使用手册', description: '产品功能、AI Claw 与日常使用说明集中在这里，先看手册再进入具体工具。', href: '/resources/library?category=manual', cta: '查看使用手册', itemCta: '查看手册 →', sortOrder: 20 },
  { key: 'skills', title: 'Skills 技能', description: '可直接复用的 AI 工作能力单独管理，资源中心只展示入口。', href: '/skills', cta: '进入 Skills 中心', itemCta: '查看 Skill →', sortOrder: 30 },
  { key: 'prompts', title: 'Prompt 提示词', description: '把可复用的任务表达和提示词集中管理，方便客户按场景快速找到模板。', href: '/prompts', cta: '进入 Prompt 中心', itemCta: '查看 Prompt →', sortOrder: 40 },
  { key: 'downloads', title: '产品下载', description: '客户端、产品资料与版本下载统一入口，避免和知识类内容混在一起。', href: '/downloads', cta: '进入下载中心', itemCta: '查看下载 →', sortOrder: 50 },
  { key: 'tutorials', title: '教程与知识', description: 'AI Claw、AI 视频、AI 生图、IP 智能体等使用教程按主题沉淀。', href: '/docs', cta: '查看教程', itemCta: '查看教程 →', sortOrder: 60 },
  { key: 'materials', title: '行业资料与其他资源', description: '行业资料、工具、模板及其他公开资料统一归档，按需查看。', href: '/resources/library', cta: '浏览资料库', itemCta: '查看资料 →', sortOrder: 70 },
] as const;

async function main() {
  const page = await prisma.page.findUnique({ where: { slug: 'resources' } });
  if (!page) {
    console.log('[RESOURCE-HUB] resources page not found, skip');
    return;
  }

  for (const item of sections) {
    await prisma.pageSection.upsert({
      where: { pageId_sectionKey: { pageId: page.id, sectionKey: item.key } },
      update: {
        title: item.title,
        subtitle: item.description,
        data: {
          href: item.href,
          cta: item.cta,
          itemCta: item.itemCta,
        } as any,
        sortOrder: item.sortOrder,
        enabled: true,
      },
      create: {
        pageId: page.id,
        sectionKey: item.key,
        title: item.title,
        subtitle: item.description,
        data: {
          href: item.href,
          cta: item.cta,
          itemCta: item.itemCta,
        } as any,
        sortOrder: item.sortOrder,
        enabled: true,
      },
    });
  }

  console.log(`[RESOURCE-HUB] seeded ${sections.length} resource hub sections`);
}

main()
  .catch((error) => {
    console.error('[RESOURCE-HUB] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
