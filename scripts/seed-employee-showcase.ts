import 'dotenv/config';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import {
  ensureFileStorageSchema,
  getLocalUploadRoot,
  getStorageConfig,
  localPublicUrl,
  ossPutUrl,
  publicUrl,
  resolveStorageFolder,
} from '../lib/storage';
import { uploadSupabaseObject } from '../lib/supabase-storage';
import {
  DEFAULT_EMPLOYEE_SHOWCASE_ITEMS,
  DEFAULT_EMPLOYEE_SHOWCASE_SECTION,
  EMPLOYEE_SHOWCASE_GALLERY,
  getEmployeeShowcaseProductSlug,
} from '../lib/employee-showcase';

type JsonObject = Record<string, any>;

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : {};
}

function imageNumberFromUrl(value: unknown): number | null {
  const url = String(value || '');
  if (!url.startsWith('/employee-showcase/')) return null;
  const match = url.match(/(?:^|\/)(\d{1,2})\.webp(?:[?#].*)?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  return number >= 1 && number <= 60 ? number : null;
}

function assetIdFromUrl(value: unknown): number | null {
  const match = String(value || '').match(/\/api\/public\/assets\/(\d+)(?:[?#].*)?$/i);
  return match ? Number(match[1]) : null;
}

async function main() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_USER) {
    throw new Error('未检测到 DATABASE_URL。请先配置 Supabase PostgreSQL 连接信息。');
  }

  await ensureFileStorageSchema();

  const storageConfig = await getStorageConfig();
  const storageProvider = storageConfig?.provider === 'OSS' ? 'OSS' : storageConfig?.provider === 'SUPABASE' ? 'SUPABASE' : 'LOCAL';
  const uploadRoot = storageProvider === 'LOCAL' ? path.resolve(getLocalUploadRoot()) : null;
  const storageFolder = resolveStorageFolder(storageConfig, 'employee-showcase');
  const targetDirectory = uploadRoot ? path.join(uploadRoot, storageFolder) : null;
  if (targetDirectory) await mkdir(targetDirectory, { recursive: true });

  const assetsByNumber = new Map<number, { id: number; url: string; label: string; alt: string }>();
  let createdAssets = 0;
  let updatedAssets = 0;

  for (const entry of EMPLOYEE_SHOWCASE_GALLERY) {
    const filename = path.basename(entry.src);
    const source = path.join(process.cwd(), 'public', 'employee-showcase', filename);
    const bytes = await readFile(source).catch(() => {
      throw new Error(`缺少初始截图：${source}。请确认项目包中的 public/employee-showcase 文件夹完整。`);
    });
    const target = targetDirectory ? path.join(targetDirectory, filename) : null;
    if (storageProvider === 'LOCAL' && target) await writeFile(target, bytes);
    if (storageProvider === 'OSS') {
      const signed = ossPutUrl(storageConfig, `${storageFolder}/${filename}`, 900);
      const uploadResponse = await fetch(signed.url, { method: 'PUT', headers: { 'Content-Type': 'image/webp' }, body: bytes as any });
      if (!uploadResponse.ok) throw new Error(`上传截图 ${filename} 到 OSS 失败（HTTP ${uploadResponse.status}）。请检查 OSS 权限、跨区域网络和存储配置。`);
    }
    if (storageProvider === 'SUPABASE') {
      await uploadSupabaseObject(`${storageFolder}/${filename}`, bytes, 'image/webp', { bucket: storageConfig?.bucket, upsert: true });
    }
    const info = target ? await stat(target) : { size: bytes.byteLength };
    const number = entry.number;
    const storageKey = `${storageFolder}/${filename}`;
    const storedUrl = storageProvider === 'LOCAL' ? localPublicUrl(storageKey) : publicUrl(storageConfig, storageKey);
    const existing = await prisma.mediaAsset.findFirst({
      where: { folder: 'employee-showcase', originalName: filename },
      orderBy: { id: 'asc' },
    });
    const metadata = {
      galleryNumber: number,
      galleryLabel: entry.label,
      gallerySource: 'Camera Roll.zip',
      syncedAt: new Date().toISOString(),
    };
    const data = {
      name: entry.label.slice(0, 200),
      originalName: filename,
      extension: 'webp',
      type: 'IMAGE',
      url: storedUrl,
      thumbnail: storedUrl,
      mimeType: 'image/webp',
      fileSize: BigInt(info.size),
      alt: entry.label,
      description: entry.label,
      sortOrder: number,
      folder: 'employee-showcase',
      storageProvider,
      storageKey,
      isPublic: true,
      metadata,
    } as any;

    const asset = existing
      ? await prisma.mediaAsset.update({ where: { id: existing.id }, data })
      : await prisma.mediaAsset.create({ data });
    if (existing) updatedAssets += 1;
    else createdAssets += 1;
    assetsByNumber.set(number, {
      id: asset.id,
      url: `/api/public/assets/${asset.id}`,
      label: entry.label,
      alt: entry.label,
    });
  }

  const productPage = await prisma.page.upsert({
    where: { slug: 'products' },
    update: {},
    create: {
      slug: 'products',
      title: '10大AI超级员工',
      description: '从内容生产、品牌IP、AI获客，到客户接待与销售跟进，覆盖企业营销关键环节。',
      status: 'PUBLISHED',
      sortOrder: 4,
    },
  });

  const currentSection = await prisma.pageSection.findUnique({
    where: { pageId_sectionKey: { pageId: productPage.id, sectionKey: 'showcase' } },
  });
  const currentData = asObject(currentSection?.data);
  const hadExistingItems = Array.isArray(currentData.items) && currentData.items.some((raw: unknown) => {
    const candidate = asObject(raw);
    return Boolean(String(candidate.title || '').trim() || String(candidate.imageUrl || '').trim());
  });
  const sourceItems = hadExistingItems ? currentData.items : DEFAULT_EMPLOYEE_SHOWCASE_ITEMS;
  const items = sourceItems.map((raw: unknown, index: number) => {
    const item = asObject(raw);
    const imageNumber = imageNumberFromUrl(item.imageUrl);
    const galleryAsset = imageNumber ? assetsByNumber.get(imageNumber) : undefined;
    const urlAssetId = assetIdFromUrl(item.imageUrl);
    return {
      ...item,
      id: String(item.id || `employee-scene-${index + 1}`),
      productSlug: item.productSlugUnlinked === true ? '' : (String(item.productSlug || '').trim() || getEmployeeShowcaseProductSlug({ ...item, productSlug: '' })),
      productSlugUnlinked: item.productSlugUnlinked === true,
      category: String(item.category || 'AI数字员工'),
      title: String(item.title || `AI数字员工场景 ${index + 1}`),
      description: String(item.description || ''),
      href: String(item.href || '/products'),
      imageUrl: galleryAsset?.url || String(item.imageUrl || ''),
      imageAssetId: galleryAsset?.id || Number(item.imageAssetId || urlAssetId) || null,
      imageAlt: galleryAsset?.alt || String(item.imageAlt || item.title || ''),
      enabled: item.enabled !== false,
    };
  });

  const nextData = {
    ...asObject(DEFAULT_EMPLOYEE_SHOWCASE_SECTION.data),
    ...currentData,
    kicker: String(currentData.kicker || DEFAULT_EMPLOYEE_SHOWCASE_SECTION.data.kicker),
    button: currentData.button && typeof currentData.button === 'object'
      ? currentData.button
      : DEFAULT_EMPLOYEE_SHOWCASE_SECTION.data.button,
    items,
    assetsSyncedAt: new Date().toISOString(),
  };

  await prisma.pageSection.upsert({
    where: { pageId_sectionKey: { pageId: productPage.id, sectionKey: 'showcase' } },
    update: {
      title: currentSection?.title || DEFAULT_EMPLOYEE_SHOWCASE_SECTION.title,
      subtitle: currentSection?.subtitle || DEFAULT_EMPLOYEE_SHOWCASE_SECTION.subtitle,
      data: nextData as any,
      sortOrder: currentSection?.sortOrder ?? DEFAULT_EMPLOYEE_SHOWCASE_SECTION.sortOrder,
      enabled: currentSection?.enabled ?? true,
    },
    create: {
      pageId: productPage.id,
      sectionKey: 'showcase',
      title: DEFAULT_EMPLOYEE_SHOWCASE_SECTION.title,
      subtitle: DEFAULT_EMPLOYEE_SHOWCASE_SECTION.subtitle,
      data: nextData as any,
      sortOrder: DEFAULT_EMPLOYEE_SHOWCASE_SECTION.sortOrder,
      enabled: true,
    },
  });

  console.log('[EMPLOYEE SHOWCASE] 同步完成');
  console.log(JSON.stringify({
    screenshotAssets: EMPLOYEE_SHOWCASE_GALLERY.length,
    createdAssets,
    updatedAssets,
    pageSlug: 'products',
    sectionKey: 'showcase',
    showcaseItems: items.length,
    enabledItems: items.filter((item: any) => item.enabled !== false).length,
    storageProvider,
    localStorageRoot: uploadRoot,
    imageUrlsStoredInDatabase: true,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('[EMPLOYEE SHOWCASE] 同步失败：', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
