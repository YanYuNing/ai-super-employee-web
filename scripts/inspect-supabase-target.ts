import 'dotenv/config';
import { Client } from 'pg';

function connection(name: string) {
  const value = String(process.env[name] || '').trim();
  if (!value || /REPLACE_|PROJECT_REF|DB_PASSWORD|POOLER_HOST/i.test(value)) {
    throw new Error(`${name} 尚未填写真实 Supabase 连接串，请从 Dashboard > Connect 复制。`);
  }
  const url = new URL(value);
  if (!/^postgres(ql)?:$/i.test(url.protocol)) throw new Error(`${name} 必须是 PostgreSQL URL。`);
  if (!(url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.pooler.supabase.com'))) {
    throw new Error(`${name} 不是 Supabase 主机；本脚本只检查云端目标库。`);
  }
  return value;
}

async function main() {
  const client = new Client({ connectionString: connection('DIRECT_URL'), application_name: 'ai-super-employee-supabase-readonly-inspect' });
  await client.connect();
  try {
    const db = await client.query<{ current_database: string; current_user: string }>('SELECT current_database(), current_user');
    console.log(`[SUPABASE INSPECT] 数据库：${db.rows[0].current_database}；用户：${db.rows[0].current_user}`);
    const tables = await client.query<{ table_name: string }>(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name`);
    if (!tables.rows.length) {
      console.log('[SUPABASE INSPECT] public schema 中没有业务表，可进入 Schema 创建步骤。');
      return;
    }
    const results: Array<{ table: string; rows: number }> = [];
    for (const { table_name } of tables.rows) {
      const quoted = `"${table_name.replace(/"/g, '""')}"`;
      const count = await client.query<{ count: string }>(`SELECT COUNT(*)::bigint AS count FROM public.${quoted}`);
      results.push({ table: table_name, rows: Number(count.rows[0].count || 0) });
    }
    console.log('[SUPABASE INSPECT] 现有 public 表与行数：');
    console.table(results);
    const nonEmpty = results.filter((item) => item.rows > 0);
    if (nonEmpty.length) {
      console.warn(`[SUPABASE INSPECT] 发现 ${nonEmpty.length} 张已有数据的表。不要直接运行 db:push 或数据迁移，先确认是否有需要保留的数据。`);
      process.exitCode = 2;
    } else {
      console.log('[SUPABASE INSPECT] 发现表但没有记录；仍建议人工确认这些表可以由本项目 Schema 管理。');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => { console.error('[SUPABASE INSPECT] 检查失败：', error instanceof Error ? error.message : error); process.exitCode = 1; });
