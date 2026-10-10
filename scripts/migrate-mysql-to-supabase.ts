import 'dotenv/config';
import mysql from 'mysql2/promise';
import { Client } from 'pg';

type Row = Record<string, unknown>;
const sourceUrl = String(process.env.MYSQL_SOURCE_URL || '').trim();
const targetUrl = String(process.env.DIRECT_URL || '').trim();
if (!sourceUrl || !targetUrl) {
  throw new Error('请在 .env 设置 MYSQL_SOURCE_URL（原 MySQL/MariaDB）和 DIRECT_URL（Supabase PostgreSQL Session Pooler / 直连地址）。');
}
if (!/^mysql:\/\//i.test(sourceUrl) && !/^mariadb:\/\//i.test(sourceUrl)) {
  throw new Error('MYSQL_SOURCE_URL 必须是 mysql:// 或 mariadb:// 连接地址。');
}
if (!/^postgres(ql)?:\/\//i.test(targetUrl)) {
  throw new Error('DIRECT_URL 必须是 postgresql:// 或 postgres:// 连接地址。');
}

function qi(value: string) { return `\`${value.replace(/`/g, '``')}\``; }
function qp(value: string) { return `"${value.replace(/"/g, '""')}"`; }
function batch<T>(items: T[], n: number) { const out: T[][] = []; for (let i=0;i<items.length;i+=n) out.push(items.slice(i,i+n)); return out; }

async function main() {
  console.log('[MIGRATION] Connect source MySQL and target Supabase PostgreSQL…');
  const normalizedSourceUrl = sourceUrl.replace(/^mariadb:\/\//i, 'mysql://');
  const source = await mysql.createConnection(normalizedSourceUrl);
  const target = new Client({ connectionString: targetUrl, application_name: 'ai-super-employee-migration' });
  await target.connect();
  try {
    const targetTableResult = await target.query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' AND table_name <> '_prisma_migrations' ORDER BY table_name");
    const targetTables = targetTableResult.rows.map((row) => row.table_name);
    if (!targetTables.length) throw new Error('目标库 public schema 中没有表。请先运行 npm.cmd run db:push:supabase。');
    if (process.env.ALLOW_NONEMPTY_TARGET !== 'true') {
      for (const table of targetTables) {
        const result = await target.query(`SELECT COUNT(*)::bigint AS count FROM ${qp('public')}.${qp(table)}`);
        if (Number(result.rows[0]?.count || 0) > 0) {
          throw new Error(`目标表 ${table} 已有数据，迁移脚本为避免覆盖已停止。确认已备份并且确实需要合并时，才将 ALLOW_NONEMPTY_TARGET=true 后重新执行。`);
        }
      }
    }

    const [sourceTableRowsRaw] = await source.query('SHOW TABLES');
    const sourceTableRows = sourceTableRowsRaw as unknown as Row[];
    const sourceTables = sourceTableRows.map((row) => String(Object.values(row)[0] || '')).filter(Boolean);
    const sharedTables = sourceTables.filter((name) => targetTables.includes(name) && !name.startsWith('_prisma_'));
    const sourceTablesWithoutTarget = sourceTables.filter((name) => !targetTables.includes(name) && !name.startsWith('_prisma_'));
    const targetTablesWithoutSource = targetTables.filter((name) => !sourceTables.includes(name));
    if (!sharedTables.length) throw new Error('原数据库与 Supabase 没有同名业务表。请核对 Prisma schema 与源数据库。');

    const fkResult = await target.query<{ table_name:string; foreign_table_name:string }>(
      "SELECT tc.table_name, ccu.table_name AS foreign_table_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.constraint_schema=kcu.constraint_schema AND tc.table_name=kcu.table_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.constraint_schema=tc.constraint_schema WHERE tc.constraint_type='FOREIGN KEY' AND tc.constraint_schema='public'"
    );
    const dependencies = new Map<string, Set<string>>();
    for (const table of sharedTables) dependencies.set(table, new Set());
    for (const row of fkResult.rows) if (dependencies.has(row.table_name) && dependencies.has(row.foreign_table_name) && row.table_name !== row.foreign_table_name) dependencies.get(row.table_name)!.add(row.foreign_table_name);
    const ordered: string[] = [];
    const remaining = new Set(sharedTables);
    while (remaining.size) {
      const ready = [...remaining].filter((table) => [...(dependencies.get(table) || [])].every((dep) => !remaining.has(dep)));
      if (!ready.length) {
        throw new Error(`目标表存在循环外键依赖，无法自动按安全顺序迁移：${[...remaining].join(', ')}。请先检查这些表的外键。`);
      }
      for (const table of ready) { ordered.push(table); remaining.delete(table); }
    }

    let totalRows = 0;
    const summary: Array<{ table: string; rows: number; skipped: boolean }> = [];
    for (const table of ordered) {
      const [columnRowsRaw] = await source.query(`SHOW COLUMNS FROM ${qi(table)}`);
      const columnRows = columnRowsRaw as unknown as Row[];
      const sourceColumns = columnRows.map((row) => String(row.Field));
      const columnResult = await target.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table]);
      const targetColumns = columnResult.rows.map((row) => row.column_name);
      const columns = sourceColumns.filter((column) => targetColumns.includes(column));
      if (!columns.length) { summary.push({ table, rows: 0, skipped: true }); continue; }
      let offset = 0, tableRows = 0;
      while (true) {
        const [rowsRaw] = await source.query(`SELECT ${columns.map(qi).join(',')} FROM ${qi(table)} LIMIT 250 OFFSET ${offset}`);
        const rows = rowsRaw as unknown as Row[];
        if (!rows.length) break;
        for (const slice of batch(rows, Math.max(1, Math.min(250, Math.floor(50000 / columns.length))))) {
          const values: unknown[] = [];
          const groups = slice.map((row) => `(${columns.map((column) => { values.push(row[column] === undefined ? null : row[column]); return `$${values.length}`; }).join(',')})`);
          const sql = `INSERT INTO ${qp('public')}.${qp(table)} (${columns.map(qp).join(',')}) VALUES ${groups.join(',')} ON CONFLICT DO NOTHING`;
          const inserted = await target.query(sql, values);
          tableRows += inserted.rowCount || 0;
        }
        offset += rows.length;
      }
      totalRows += tableRows;
      summary.push({ table, rows: tableRows, skipped: false });
      console.log(`[MIGRATION] ${table}: ${tableRows} rows imported`);
    }

    // Reset serial/identity sequences to avoid duplicate IDs after migration.
    for (const table of ordered) {
      const hasId = await target.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name='id'", [table]);
      if (!hasId.rowCount) continue;
      const sequence = await target.query<{ sequence_name: string | null }>("SELECT pg_get_serial_sequence($1, 'id') AS sequence_name", [`public.${table}`]);
      const seq = sequence.rows[0]?.sequence_name;
      if (!seq) continue;
      await target.query(`SELECT setval($1::regclass, COALESCE((SELECT MAX(${qp('id')}) FROM ${qp('public')}.${qp(table)}), 1), (SELECT COUNT(*) > 0 FROM ${qp('public')}.${qp(table)}))`, [seq]);
    }
    console.log('\n[MIGRATION] Completed. Source tables without a same-name target table were intentionally skipped.');
    console.log(JSON.stringify({ importedRows: totalRows, tables: summary, sourceTablesWithoutTarget, targetTablesWithoutSource }, null, 2));
    console.log('Please check the skipped/zero-row tables and compare source/target counts before switching production traffic.');
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((error) => { console.error('[MIGRATION] Failed:', error instanceof Error ? error.message : error); process.exitCode = 1; });
