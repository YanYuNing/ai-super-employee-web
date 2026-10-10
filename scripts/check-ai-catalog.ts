import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { getCoreAiEmployees } from '@/lib/catalog';

async function main() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, slug: true, name: true, status: true },
  });

  const core = getCoreAiEmployees(products);
  const coreIds = new Set(core.map((item) => item.id));
  const extras = products.filter((item) => !coreIds.has(item.id));

  console.log(`[CATALOG] ACTIVE products: ${products.length}`);
  console.log(`[CATALOG] CORE AI employees: ${core.length}`);
  core.forEach((item, index) => console.log(`  ${String(index + 1).padStart(2, '0')}. ${item.name} (${item.slug})`));

  if (extras.length) {
    console.log(`[CATALOG] non-core active products: ${extras.length}`);
    extras.forEach((item) => console.log(`  - ${item.name} (${item.slug})`));
  }

  if (core.length !== 9) {
    process.exitCode = 2;
    console.error('[CATALOG] ERROR: 官网9大AI员工当前不是9条，请检查产品数据。');
  } else {
    console.log('[CATALOG] OK: 官网9大AI员工口径为9条。');
  }
}

main()
  .catch((error) => {
    console.error('[CATALOG] check failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
