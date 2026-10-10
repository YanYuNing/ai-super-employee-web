import { prisma } from '@/lib/prisma';
import { ensureFileStorageSchema } from '@/lib/storage';

export type PublicSection = {
  id: number;
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  data: Record<string, any>;
  sortOrder: number;
  enabled: boolean;
};

export function jsonObject(value: unknown): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, any>;
}

export async function getSiteSetting() {
  return prisma.siteSetting.findUnique({ where: { id: 1 } });
}

export async function getHomeSections() {
  const page = await prisma.page.findUnique({
    where: { slug: 'home' },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
  return (page?.sections || []) as PublicSection[];
}

export function sectionMap(sections: PublicSection[]) {
  return Object.fromEntries(sections.map((section) => [section.sectionKey, section]));
}

export async function getHomeBundle() {
  await ensureFileStorageSchema();
  const [setting, sections, products, solutions, cases, resources, skills, prompts] = await Promise.all([
    getSiteSetting(),
    getHomeSections(),
    prisma.product.findMany({ where: { status: 'ACTIVE' }, include: { features: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } }),
    prisma.solution.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }] }),
    prisma.caseStudy.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], take: 6 }),
    prisma.resource.findMany({ where: { status: 'PUBLISHED' }, include: { category: true }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], take: 6 }),
    prisma.skill.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }], take: 4 }),
    prisma.prompt.findMany({ where: { status: 'PUBLISHED' }, include: { category: true }, orderBy: { updatedAt: 'desc' }, take: 4 }),
  ]);
  return { setting, sections, sectionMap: sectionMap(sections), products, solutions, cases, resources, skills, prompts };
}

export async function getPage(slug: string) {
  return prisma.page.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: { sections: { orderBy: { sortOrder: 'asc' } } },
  });
}

export function absoluteUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}
