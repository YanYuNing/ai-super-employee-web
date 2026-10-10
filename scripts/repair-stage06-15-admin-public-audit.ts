import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

function parseJsonObject(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function main() {
  const removedCommon = await prisma.homeConfig.deleteMany({ where: { key: 'site.common' } });

  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (settings) {
    await prisma.siteSetting.update({
      where: { id: 1 },
      data: { address: null, downloadUrl: null, socialLinks: Prisma.DbNull },
    });
  }

  const home = await prisma.homeConfig.findUnique({ where: { key: 'site.home' } });
  let cleanedHomeKeys = 0;
  if (home?.value) {
    const value = parseJsonObject(home.value);
    const legacyKeys = ['heroTaskStatus', 'heroTaskAgent', 'heroTaskTitle', 'heroTaskMode', 'heroTaskMeta', 'heroTaskProgress', 'heroFloating1', 'heroFloating2', 'heroFloating3'];
    for (const key of legacyKeys) {
      if (key in value) { delete value[key]; cleanedHomeKeys += 1; }
    }
    await prisma.homeConfig.update({ where: { key: 'site.home' }, data: { value: JSON.stringify(value) } });
  }

  const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
  let removedLegacyEmployeeItems = 0;
  let clearedHomeSections = 0;
  if (homePage) {
    await prisma.page.update({ where: { id: homePage.id }, data: { content: null, coverImage: null } });
    const result = await prisma.pageSection.updateMany({
      where: { pageId: homePage.id },
      data: { content: null, imageUrl: null, videoUrl: null },
    });
    clearedHomeSections = result.count;
    const employeeSection = await prisma.pageSection.findUnique({ where: { pageId_sectionKey: { pageId: homePage.id, sectionKey: 'ai-employees' } } });
    if (employeeSection?.data && typeof employeeSection.data === 'object' && !Array.isArray(employeeSection.data)) {
      const data = { ...(employeeSection.data as Record<string, any>) };
      if ('items' in data) { delete data.items; removedLegacyEmployeeItems = 1; await prisma.pageSection.update({ where: { id: employeeSection.id }, data: { data } }); }
    }
  }

  const aboutPage = await prisma.page.findUnique({ where: { slug: 'about' } });
  if (aboutPage) await prisma.page.update({ where: { id: aboutPage.id }, data: { content: null, coverImage: null } });

  const resourcesPage = await prisma.page.findUnique({ where: { slug: 'resources' } });
  let removedResourceLegacySections = 0;
  if (resourcesPage) {
    const result = await prisma.pageSection.deleteMany({
      where: { pageId: resourcesPage.id, sectionKey: { in: ['hero', 'cards', 'empty'] } },
    });
    removedResourceLegacySections = result.count;
  }

  const downloadsPage = await prisma.page.findUnique({ where: { slug: 'downloads' } });
  let removedDownloadDetailSections = 0;
  if (downloadsPage) {
    const result = await prisma.pageSection.deleteMany({
      where: { pageId: downloadsPage.id, sectionKey: 'detail' },
    });
    removedDownloadDetailSections = result.count;
  }

  const contactPage = await prisma.page.findUnique({ where: { slug: 'contact' } });
  let removedContactForm = 0;
  if (contactPage) {
    await prisma.page.update({ where: { id: contactPage.id }, data: { content: null, coverImage: null } });
    const result = await prisma.pageSection.deleteMany({ where: { pageId: contactPage.id, sectionKey: 'form' } });
    removedContactForm = result.count;
  }

  const siteCommon = await prisma.homeConfig.findUnique({ where: { key: 'site.common' } });
  console.log(JSON.stringify({
    removedCommon: removedCommon.count,
    cleanedHomeKeys,
    clearedHomeSections,
    removedLegacyEmployeeItems,
    removedContactForm,
    removedResourceLegacySections,
    removedDownloadDetailSections,
    siteCommonRemaining: Boolean(siteCommon),
  }, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => prisma.$disconnect());
