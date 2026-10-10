import 'dotenv/config';
import { Client } from 'pg';

type DbRow = Record<string, unknown>;
type ColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
  is_identity: 'YES' | 'NO';
  is_generated: string;
  ordinal_position: number;
};

const sourceUrl = String(process.env.LOCAL_SOURCE_DATABASE_URL || '').trim();
const targetUrl = String(process.env.DIRECT_URL || '').trim();
const allowNonemptyTarget = process.env.ALLOW_NONEMPTY_TARGET === 'true';
// This table is a historical MySQL migration archive, not live app data. Keep all other unmapped tables protected.
const ignoredSourceTables = new Set(['mysql_prisma_migrations_archive', ...String(process.env.MIGRATION_IGNORED_SOURCE_TABLES || '').split(',').map((name) => name.trim()).filter(Boolean)]);

if (!sourceUrl || !targetUrl) {
  throw new Error('请配置 LOCAL_SOURCE_DATABASE_URL（本地 PostgreSQL 源库）和 DIRECT_URL（目标 PostgreSQL 数据库）。');
}
if (!/^postgres(ql)?:\/\//i.test(sourceUrl)) {
  throw new Error('LOCAL_SOURCE_DATABASE_URL 必须是 postgresql:// 或 postgres:// 连接地址。');
}
if (!/^postgres(ql)?:\/\//i.test(targetUrl)) {
  throw new Error('DIRECT_URL 必须是 postgresql:// 或 postgres:// 连接地址。');
}

function parsedDbIdentity(value: string) {
  const url = new URL(value);
  return {
    host: url.hostname.toLowerCase(),
    port: url.port || '5432',
    database: decodeURIComponent(url.pathname.replace(/^\//, '')).split('/')[0],
    user: decodeURIComponent(url.username),
  };
}

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}
function batch<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

const sourceIdentity = parsedDbIdentity(sourceUrl);
const targetIdentity = parsedDbIdentity(targetUrl);
if (sourceIdentity.host === targetIdentity.host && sourceIdentity.port === targetIdentity.port && sourceIdentity.database === targetIdentity.database) {
  throw new Error(`源库和目标库都指向 ${sourceIdentity.host}:${sourceIdentity.port}/${sourceIdentity.database}。为保护原库，已停止迁移。请将 DIRECT_URL 设置为 Supabase 目标库，并先运行 npm.cmd run db:preflight:supabase。`);
}
if (sourceIdentity.database !== 'ai' && process.env.ALLOW_NON_AI_SOURCE_DATABASE !== 'true') {
  throw new Error(`源库当前为「${sourceIdentity.database}」，而本次确认的本地源库是「ai」。请检查 LOCAL_SOURCE_DATABASE_URL；若确实要使用其他数据库，需显式设置 ALLOW_NON_AI_SOURCE_DATABASE=true。`);
}

async function listPublicTables(client: Client) {
  const result = await client.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> '_prisma_migrations'
      ORDER BY table_name`,
  );
  return result.rows.map((row) => row.table_name);
}

async function tableColumns(client: Client, table: string): Promise<ColumnInfo[]> {
  const result = await client.query<ColumnInfo>(
    `SELECT column_name, data_type, udt_name, is_nullable, column_default, is_identity, is_generated, ordinal_position
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position`,
    [table],
  );
  return result.rows;
}

async function main() {
  console.log('[MIGRATION] 本地 PostgreSQL → 目标 PostgreSQL');
  console.log('[MIGRATION] 源库只读:', `${sourceIdentity.host}:${sourceIdentity.port}/${sourceIdentity.database}`);
  console.log('[MIGRATION] 目标库:', `${targetIdentity.host}:${targetIdentity.port}/${targetIdentity.database}`);
  if (allowNonemptyTarget) console.warn('[MIGRATION] ALLOW_NONEMPTY_TARGET=true：将以 ON CONFLICT DO NOTHING 合并，请确认目标库备份已完成。');

  // Enforce read-only behavior at the source connection, so migration never mutates local `ai`.
  const source = new Client({
    connectionString: sourceUrl,
    application_name: 'ai-super-employee-source-read-only',
    options: '-c default_transaction_read_only=on',
  });
  const target = new Client({ connectionString: targetUrl, application_name: 'ai-super-employee-pg-migration' });
  let targetTransactionStarted = false;
  let sourceTransactionStarted = false;

  await source.connect();
  await target.connect();
  try {
    await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    sourceTransactionStarted = true;

    const sourceTables = await listPublicTables(source);
    const targetTables = await listPublicTables(target);
    if (!targetTables.length) {
      throw new Error('目标库 public schema 中没有表。请先确认 DIRECT_URL 指向正确的空目标库，再运行 npm.cmd run db:push:supabase。');
    }

    if (!allowNonemptyTarget) {
      for (const table of targetTables) {
        const result = await target.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}`);
        if (Number(result.rows[0]?.count || 0) > 0) {
          throw new Error(`目标表 ${table} 已有数据。为避免覆盖或合并到错误数据库，已停止迁移。请先检查目标库；不要对原库运行此脚本。`);
        }
      }
    }

    const sharedTables = sourceTables.filter((table) => targetTables.includes(table));
    const intentionallyIgnoredSourceTables = sourceTables.filter((table) => !targetTables.includes(table) && ignoredSourceTables.has(table));
    const sourceTablesWithoutTarget = sourceTables.filter((table) => !targetTables.includes(table) && !ignoredSourceTables.has(table));
    if (intentionallyIgnoredSourceTables.length) {
      console.warn(`[MIGRATION] 明确跳过历史/非业务表：${intentionallyIgnoredSourceTables.join(', ')}`);
    }
    const targetTablesWithoutSource = targetTables.filter((table) => !sourceTables.includes(table));
    if (!sharedTables.length) throw new Error('本地源库和目标库没有同名 public 表，请检查 Prisma Schema 和连接字符串。');
    if (sourceTablesWithoutTarget.length && process.env.ALLOW_UNMAPPED_SOURCE_TABLES !== 'true') {
      throw new Error(`源库有 ${sourceTablesWithoutTarget.length} 张表在目标 Prisma Schema 中不存在：${sourceTablesWithoutTarget.join(', ')}。为避免漏迁数据，未写入目标库。确认这些是无需迁移的旧表后，才可显式设置 ALLOW_UNMAPPED_SOURCE_TABLES=true 重试。`);
    }

    const fkResult = await target.query<{ table_name: string; foreign_table_name: string }>(
      `SELECT tc.table_name, ccu.table_name AS foreign_table_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema AND tc.table_name = kcu.table_name
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_schema = 'public'`,
    );
    const dependencies = new Map<string, Set<string>>();
    for (const table of sharedTables) dependencies.set(table, new Set());
    for (const fk of fkResult.rows) {
      if (dependencies.has(fk.table_name) && dependencies.has(fk.foreign_table_name) && fk.table_name !== fk.foreign_table_name) {
        dependencies.get(fk.table_name)!.add(fk.foreign_table_name);
      }
    }

    const ordered: string[] = [];
    const remaining = new Set(sharedTables);
    while (remaining.size) {
      const ready = [...remaining].filter((table) => [...(dependencies.get(table) || [])].every((dependency) => !remaining.has(dependency)));
      if (!ready.length) {
        throw new Error(`检测到表之间存在循环外键依赖，未写入目标数据：${[...remaining].join(', ')}。请先检查这些外键。`);
      }
      for (const table of ready) { ordered.push(table); remaining.delete(table); }
    }

    await target.query('BEGIN');
    targetTransactionStarted = true;
    let totalSourceRows = 0;
    let totalInsertedRows = 0;
    const summary: Array<{ table: string; sourceRows: number; insertedRows: number; skippedRows: number; status: string }> = [];

    for (const table of ordered) {
      const sourceCountResult = await source.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}`);
      const sourceRows = Number(sourceCountResult.rows[0]?.count || 0);
      totalSourceRows += sourceRows;

      const sourceColumnInfo = await tableColumns(source, table);
      const targetColumnInfo = await tableColumns(target, table);
      const sourceColumnSet = new Set(sourceColumnInfo.map((column) => column.column_name));
      const targetColumnNames = new Set(targetColumnInfo.map((column) => column.column_name));
      const columns = targetColumnInfo.map((column) => column.column_name).filter((column) => sourceColumnSet.has(column));
      const missingRequired = targetColumnInfo.filter((column) =>
        !sourceColumnSet.has(column.column_name) &&
        column.is_nullable === 'NO' &&
        !column.column_default &&
        column.is_identity === 'NO' &&
        column.is_generated === 'NEVER',
      );
      if (missingRequired.length) {
        throw new Error(`表 ${table} 的源库缺少目标必填列：${missingRequired.map((column) => column.column_name).join(', ')}。目标事务将回滚。`);
      }
      if (!columns.length) {
        if (sourceRows > 0) throw new Error(`表 ${table} 有 ${sourceRows} 行数据，但源表与目标表没有匹配列；目标事务将回滚。`);
        summary.push({ table, sourceRows, insertedRows: 0, skippedRows: 0, status: '空表，无匹配列' });
        continue;
      }
      if (columns.some((column) => !targetColumnNames.has(column))) throw new Error(`内部检查失败：表 ${table} 列映射不一致。`);
      if (!sourceRows) {
        summary.push({ table, sourceRows: 0, insertedRows: 0, skippedRows: 0, status: '空表' });
        console.log(`[MIGRATION] ${table}: 0 rows`);
        continue;
      }

      const targetByName = new Map(targetColumnInfo.map((column) => [column.column_name, column]));
      const orderById = columns.includes('id') ? ` ORDER BY ${quoteIdentifier('id')} ASC` : '';
      let offset = 0;
      let insertedRows = 0;
      while (true) {
        const select = await source.query(
          `SELECT ${columns.map(quoteIdentifier).join(', ')} FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}${orderById} LIMIT 250 OFFSET $1`,
          [offset],
        );
        const rows = select.rows as DbRow[];
        if (!rows.length) break;
        for (const slice of batch(rows, Math.max(1, Math.min(250, Math.floor(50000 / columns.length))))) {
          const values: unknown[] = [];
          const valueGroups = slice.map((row) => `(${columns.map((column) => {
            let value = row[column] === undefined ? null : row[column];
            const targetColumn = targetByName.get(column);
            if (value !== null && (targetColumn?.udt_name === 'json' || targetColumn?.udt_name === 'jsonb')) {
              value = JSON.stringify(value);
            }
            values.push(value);
            return `$${values.length}`;
          }).join(', ')})`);
          const insertSql = `INSERT INTO ${quoteIdentifier('public')}.${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(', ')}) VALUES ${valueGroups.join(', ')} ON CONFLICT DO NOTHING`;
          const result = await target.query(insertSql, values);
          insertedRows += result.rowCount || 0;
        }
        offset += rows.length;
      }
      totalInsertedRows += insertedRows;
      summary.push({ table, sourceRows, insertedRows, skippedRows: Math.max(0, sourceRows - insertedRows), status: insertedRows === sourceRows ? '完整复制' : '有跳过，需核对' });
      console.log(`[MIGRATION] ${table}: source=${sourceRows}, inserted=${insertedRows}`);
    }

    // Verify source and destination row counts before commit. Any discrepancy rolls the target transaction back.
    if (!allowNonemptyTarget) {
      const mismatches: string[] = [];
      for (const entry of summary) {
        const count = await target.query(`SELECT COUNT(*)::bigint AS count FROM ${quoteIdentifier('public')}.${quoteIdentifier(entry.table)}`);
        const targetRows = Number(count.rows[0]?.count || 0);
        if (targetRows !== entry.sourceRows) mismatches.push(`${entry.table}: source=${entry.sourceRows}, target=${targetRows}`);
      }
      if (mismatches.length) throw new Error(`源/目标行数核验未通过，目标事务将回滚：${mismatches.join('; ')}`);
      console.log('[MIGRATION] 迁移表源/目标行数一致，准备提交目标事务。');
    }

    // Restore integer id sequences after preserving IDs from the source database.
    for (const table of ordered) {
      const idColumn = await target.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'`,
        [table],
      );
      if (!idColumn.rowCount) continue;
      const seqResult = await target.query<{ sequence_name: string | null }>(`SELECT pg_get_serial_sequence($1, 'id') AS sequence_name`, [`public.${table}`]);
      const sequenceName = seqResult.rows[0]?.sequence_name;
      if (!sequenceName) continue;
      await target.query(
        `SELECT setval($1::regclass, COALESCE((SELECT MAX(${quoteIdentifier('id')}) FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}), 1), (SELECT COUNT(*) > 0 FROM ${quoteIdentifier('public')}.${quoteIdentifier(table)}))`,
        [sequenceName],
      );
    }

    await target.query('COMMIT');
    targetTransactionStarted = false;
    await source.query('COMMIT');
    sourceTransactionStarted = false;

    console.log('\n[MIGRATION] 完成。源库仅以只读方式访问，没有执行任何写入或 DDL。');
    console.log(JSON.stringify({ sourceDatabase: sourceIdentity.database, targetDatabase: targetIdentity.database, totalSourceRows, totalInsertedRows, intentionallyIgnoredSourceTables, sourceTablesWithoutTarget, targetTablesWithoutSource, tables: summary }, null, 2));
    if (sourceTablesWithoutTarget.length) console.warn(`[MIGRATION] 以下源表在目标 Schema 中不存在，未迁移：${sourceTablesWithoutTarget.join(', ')}`);
    if (summary.some((row) => row.status === '有跳过，需核对')) console.warn('[MIGRATION] 存在未插入行；请核对目标库计数和冲突主键后再切换生产流量。');
    console.log('请比较源/目标表行数，并抽查产品、管理员、角色权限、页面区块、素材资产和下载版本。');
  } catch (error) {
    if (targetTransactionStarted) {
      await target.query('ROLLBACK').catch(() => undefined);
      console.error('[MIGRATION] 目标事务已回滚；本地源库保持只读。');
    }
    if (sourceTransactionStarted) await source.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    await source.end().catch(() => undefined);
    await target.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error('[MIGRATION] Failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
