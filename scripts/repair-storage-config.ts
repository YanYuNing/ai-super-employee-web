import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { ensureStorageConfigTable, ensureFileStorageSchema, getStorageConfig, getLocalUploadRoot } from '../lib/storage';

async function main() {
  const result = await ensureStorageConfigTable();
  await ensureFileStorageSchema();
  const config = await getStorageConfig();
  console.log('[STORAGE] tableReady:', true);
  console.log('[STORAGE] tableCreated:', result.created);
  console.log('[STORAGE] fileSchemaReady:', true);
  console.log('[STORAGE] provider:', config?.provider);
  console.log('[STORAGE] enabled:', config?.enabled);
  console.log('[STORAGE] localRoot:', getLocalUploadRoot());
  console.log('[STORAGE] maxFileSizeMb:', config?.maxFileSizeMb);
  console.log('[STORAGE] allowedTypes:', config?.allowedTypes);
  console.log('[STORAGE] repair complete');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('[STORAGE] repair failed:', error);
    try {
      await prisma.$disconnect();
    } finally {
      process.exitCode = 1;
    }
  });
