import { prisma } from '@/lib/prisma';

export type HubItem = {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  meta?: string;
};

export type ResourceHubBlock = {
  key: 'skills' | 'prompts' | 'guides' | 'downloads' | 'materials';
  label: string;
  title: string;
  description: string;
  href: string;
  count: number;
  items: HubItem[];
  enabled?: boolean;
};

export const DEFAULT_RESOURCE_HUB_BLOCKS = [
  {
    key: 'skills',
    label: 'SKILLS',
    title: 'Skills 技能库',
    description: '可直接下载和复用的 AI 工作能力，以版本包形式统一管理。',
    href: '/skills',
  },
  {
    key: 'prompts',
    label: 'PROMPT',
    title: 'Prompt 提示词',
    description: '沉淀经过验证的提示词模板，让常用任务可以快速复用。',
    href: '/prompts',
  },
  {
    key: 'guides',
    label: 'GUIDES',
    title: '教程与使用手册',
    description: '产品使用手册、AI Claw 教程与操作指南集中在一个入口。',
    href: '/docs',
  },
  {
    key: 'downloads',
    label: 'DOWNLOADS',
    title: '产品下载',
    description: '客户端、资料包与正式版本统一管理，版本清晰、下载直接。',
    href: '/downloads',
  },
  {
    key: 'materials',
    label: 'MATERIALS',
    title: '行业资料与资源',
    description: '行业资料、产品介绍、模板与其他公开资料统一沉淀。',
    href: '/resources/library',
  },
] as const;

function first<T>(items: T[], limit: number) {
  return items.slice(0, Math.max(0, limit));
}

export async function getResourceHubData(limit = 3) {
  const [
    skills,
    skillCount,
    prompts,
    promptCount,
    tutorials,
    tutorialCount,
    manuals,
    manualCount,
    downloads,
    downloadCount,
    materials,
    materialCount,
  ] = await Promise.all([
    prisma.skill.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      select: { id: true, slug: true, name: true, description: true },
    }),
    prisma.skill.count({ where: { status: 'PUBLISHED' } }),
    prisma.prompt.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.prompt.count({ where: { status: 'PUBLISHED' } }),
    prisma.tutorial.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.tutorial.count({ where: { status: 'PUBLISHED' } }),
    prisma.resource.findMany({
      where: { status: 'PUBLISHED', category: { slug: 'manuals' } },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.resource.count({ where: { status: 'PUBLISHED', category: { slug: 'manuals' } } }),
    prisma.download.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      include: { versions: { where: { isLatest: true }, take: 1, select: { version: true } } },
    }),
    prisma.download.count({ where: { status: 'ACTIVE' } }),
    prisma.resource.findMany({
      where: { status: 'PUBLISHED', OR: [{ categoryId: null }, { category: { slug: { not: 'manuals' } } }] },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
      take: limit,
      select: { id: true, slug: true, title: true, description: true },
    }),
    prisma.resource.count({ where: { status: 'PUBLISHED', OR: [{ categoryId: null }, { category: { slug: { not: 'manuals' } } }] } }),
  ]);

  const guides = [
    ...manuals.map((x) => ({
      id: `manual-${x.id}`,
      title: x.title,
      description: x.description,
      href: `/resources/${x.slug}`,
      meta: '使用手册',
    })),
    ...tutorials.map((x) => ({
      id: `tutorial-${x.id}`,
      title: x.title,
      description: x.description,
      href: `/docs/${x.slug}`,
      meta: '教程',
    })),
  ].slice(0, limit);

  const blocks: ResourceHubBlock[] = [
    {
      key: 'skills',
      label: 'SKILLS',
      title: 'Skills 技能库',
      description: '可直接下载和复用的 AI 工作能力，以版本包形式统一管理。',
      href: '/skills',
      count: skillCount,
      items: first(skills.map((x) => ({ id: `skill-${x.id}`, title: x.name, description: x.description, href: `/skills/${x.slug}` })), limit),
    },
    {
      key: 'prompts',
      label: 'PROMPT',
      title: 'Prompt 提示词',
      description: '沉淀经过验证的提示词模板，让常用任务可以快速复用。',
      href: '/prompts',
      count: promptCount,
      items: first(prompts.map((x) => ({ id: `prompt-${x.id}`, title: x.title, description: x.description, href: `/prompts/${x.slug}` })), limit),
    },
    {
      key: 'guides',
      label: 'GUIDES',
      title: '教程与使用手册',
      description: '产品使用手册、AI Claw 教程与操作指南集中在一个入口。',
      href: '/docs',
      count: manualCount + tutorialCount,
      items: guides,
    },
    {
      key: 'downloads',
      label: 'DOWNLOADS',
      title: '产品下载',
      description: '客户端、资料包与正式版本统一管理，版本清晰、下载直接。',
      href: '/downloads',
      count: downloadCount,
      items: downloads.map((x) => ({
        id: `download-${x.id}`,
        title: x.name,
        description: x.description,
        href: '/downloads',
        meta: x.versions[0]?.version ? `版本 ${x.versions[0].version}` : '暂无版本',
      })),
    },
    {
      key: 'materials',
      label: 'MATERIALS',
      title: '行业资料与资源',
      description: '行业资料、产品介绍、模板与其他公开资料统一沉淀。',
      href: '/resources/library',
      count: materialCount,
      items: materials.map((x) => ({ id: `resource-${x.id}`, title: x.title, description: x.description, href: `/resources/${x.slug}` })),
    },
  ];

  return blocks;
}

export function resolveResourceHubBlocks(data: unknown, base: ResourceHubBlock[]) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return base;
  const rawBlocks = (data as Record<string, unknown>).blocks;
  if (!Array.isArray(rawBlocks)) return base;

  const overrides = new Map<string, Record<string, any>>();
  rawBlocks.forEach((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return;
    const key = String((item as Record<string, unknown>).key || '').trim();
    if (!key) return;
    overrides.set(key, item as Record<string, any>);
  });

  const orderedKeys = rawBlocks.map((item) => (item && typeof item === 'object' ? String((item as Record<string, unknown>).key || '') : '')).filter(Boolean);
  const result = [...base]
    .sort((a, b) => {
      const ai = orderedKeys.indexOf(a.key);
      const bi = orderedKeys.indexOf(b.key);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map((block) => {
      const override = overrides.get(block.key);
      if (!override) return block;
      return {
        ...block,
        label: typeof override.label === 'string' && override.label.trim() ? override.label : block.label,
        title: typeof override.title === 'string' && override.title.trim() ? override.title : block.title,
        description: typeof override.description === 'string' && override.description.trim() ? override.description : block.description,
        href: typeof override.href === 'string' && override.href.trim() ? override.href : block.href,
        enabled: override.enabled !== false,
      };
    });

  return result.filter((block) => block.enabled !== false);
}
