import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';
import { DEFAULT_RESOURCE_HUB_BLOCKS } from '@/lib/resource-hub';

function normalizeBlocks(raw: unknown) {
  if (!Array.isArray(raw)) return DEFAULT_RESOURCE_HUB_BLOCKS.map((x) => ({ ...x, enabled: true }));
  const validKeys = new Set(DEFAULT_RESOURCE_HUB_BLOCKS.map((x) => x.key));
  const result: any[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const value = item as Record<string, any>;
    const key = String(value.key || '').trim();
    if (!validKeys.has(key as any)) continue;
    const base = DEFAULT_RESOURCE_HUB_BLOCKS.find((x) => x.key === key)!;
    result.push({ key, label: String(value.label || base.label), title: String(value.title || base.title), description: String(value.description || base.description), href: String(value.href || base.href), enabled: value.enabled !== false });
  }
  for (const base of DEFAULT_RESOURCE_HUB_BLOCKS) {
    if (!result.some((x) => x.key === base.key)) result.push({ ...base, enabled: true });
  }
  return result;
}

async function readPage(slug: string) {
  return prisma.page.findUnique({ where: { slug }, include: { sections: true } });
}

export async function GET() {
  const admin = await checkPermission('page.view');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });
  const [home, resources] = await Promise.all([readPage('home'), readPage('resources')]);
  const homeSection = home?.sections.find((section) => section.sectionKey === 'resources');
  const resourceHubSection = resources?.sections.find((section) => section.sectionKey === 'resource-hub');
  const homeData = homeSection?.data && typeof homeSection.data === 'object' && !Array.isArray(homeSection.data) ? homeSection.data as Record<string, any> : {};
  const resourceHubData = resourceHubSection?.data && typeof resourceHubSection.data === 'object' && !Array.isArray(resourceHubSection.data) ? resourceHubSection.data as Record<string, any> : {};
  return NextResponse.json({ success: true, data: { blocks: normalizeBlocks(resourceHubData.blocks || homeData.blocks) } });
}

export async function PUT(request: Request) {
  const editor = await checkPermission('page.edit');
  if (!editor) return NextResponse.json({ success: false, message: '没有页面编辑权限' }, { status: 403 });
  const body = await request.json();
  const blocks = normalizeBlocks(body.blocks);
  try {
    const saved = await prisma.$transaction(async (tx) => {
      const home = await tx.page.findUnique({ where: { slug: 'home' }, include: { sections: true } });
      const resources = await tx.page.findUnique({ where: { slug: 'resources' }, include: { sections: true } });
      if (!home || !resources) throw new Error('首页或资源中心页面尚未初始化，请先完成 CMS 初始化。');
      const homeSection = home.sections.find((section) => section.sectionKey === 'resources');
      if (homeSection) {
        const old = homeSection.data && typeof homeSection.data === 'object' && !Array.isArray(homeSection.data) ? homeSection.data as Record<string, any> : {};
        await tx.pageSection.update({ where: { id: homeSection.id }, data: { data: { ...old, blocks } as any } });
      } else {
        await tx.pageSection.create({ data: { pageId: home.id, sectionKey: 'resources', title: 'AI资源中心', subtitle: 'Skills、Prompt、教程、产品下载与行业资料', sortOrder: 70, enabled: true, data: { blocks } as any } });
      }
      const resourceSection = resources.sections.find((section) => section.sectionKey === 'resource-hub');
      if (resourceSection) {
        await tx.pageSection.update({ where: { id: resourceSection.id }, data: { data: { blocks } as any, enabled: true } });
      } else {
        await tx.pageSection.create({ data: { pageId: resources.id, sectionKey: 'resource-hub', title: '资源模块', subtitle: '按功能模块集中进入', sortOrder: 10, enabled: true, data: { blocks } as any } });
      }
      return blocks;
    });
    return NextResponse.json({ success: true, data: { blocks: saved } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '保存资源中心结构失败' }, { status: 400 });
  }
}
