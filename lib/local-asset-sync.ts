import { prisma } from '@/lib/prisma';
import { ensureFileStorageSchema } from '@/lib/storage';

/** 将已有 Resource.fileUrl/url 与 MediaAsset 进行一次增量关联，不覆盖已有关联。 */
export async function syncLocalResourceAssets() {
  await ensureFileStorageSchema();
  const resourceClient = prisma.resource as any;
  const resources = await resourceClient.findMany({
    where: { fileUrl: { not: null }, fileAssetId: null },
    select: { id: true, fileUrl: true, fileAssetId: true },
  });
  let linked = 0;
  for (const resource of resources) {
    const url = String(resource.fileUrl || '').trim();
    if (!url) continue;
    const asset = await prisma.mediaAsset.findFirst({ where: { OR: [{ url }, { storageKey: url.replace(/^\/uploads\//, '') }] }, select: { id: true } });
    if (!asset) continue;
    await resourceClient.update({ where: { id: resource.id }, data: { fileAssetId: asset.id } });
    linked += 1;
  }
  return { checked: resources.length, linked };
}

/** Backward-compatible name used by the CLI sync script. */
export const syncLocalAssets = syncLocalResourceAssets;

if (require.main === module) {
  syncLocalResourceAssets().then(result => {
    console.log('[RESOURCE] sync complete', result);
    void prisma.$disconnect();
  }).catch(error => {
    console.error('[RESOURCE] sync failed', error);
    void prisma.$disconnect();
    process.exitCode = 1;
  });
}
