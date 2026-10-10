import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { syncLocalAssets } from '../lib/local-asset-sync';

async function main() {
  const summary = await syncLocalAssets();
  console.log('[ASSETS] local asset sync complete:', summary);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { console.error('[ASSETS] local asset sync failed:', error); await prisma.$disconnect(); process.exitCode = 1; });
