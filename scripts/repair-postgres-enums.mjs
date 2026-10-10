import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const enumDefinitions = {
  UserStatus: ['ACTIVE', 'DISABLED'],
  AdminStatus: ['ACTIVE', 'DISABLED'],
  ContentStatus: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  ProductStatus: ['ACTIVE', 'INACTIVE'],
  SkillStatus: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
  DownloadStatus: ['ACTIVE', 'INACTIVE'],
  LeadStatus: ['NEW', 'CONTACTED', 'FOLLOWING', 'CONVERTED', 'CLOSED'],
  LeadSource: ['WEBSITE', 'DOWNLOAD', 'DEMO', 'PRODUCT', 'SKILL', 'PROMPT', 'CASE', 'CONTACT', 'OTHER'],
  DownloadType: ['CLIENT', 'AGENT', 'SKILL', 'TEMPLATE', 'RESOURCE', 'OTHER'],
  Platform: ['WINDOWS', 'MACOS', 'LINUX', 'WEB', 'ANDROID', 'IOS', 'OTHER'],
};

// These names mirror @@map(...) and enum-typed fields in prisma/schema.prisma.
const enumColumns = [
  { table: 'users', column: 'status', type: 'UserStatus', defaultValue: 'ACTIVE' },
  { table: 'admins', column: 'status', type: 'AdminStatus', defaultValue: 'ACTIVE' },
  { table: 'products', column: 'status', type: 'ProductStatus', defaultValue: 'ACTIVE' },
  { table: 'skills', column: 'status', type: 'SkillStatus', defaultValue: 'DRAFT' },
  { table: 'prompt_categories', column: 'status', type: 'ContentStatus', defaultValue: 'PUBLISHED' },
  { table: 'prompts', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'resource_categories', column: 'status', type: 'ContentStatus', defaultValue: 'PUBLISHED' },
  { table: 'resources', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'tutorial_categories', column: 'status', type: 'ContentStatus', defaultValue: 'PUBLISHED' },
  { table: 'tutorials', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'downloads', column: 'type', type: 'DownloadType' },
  { table: 'downloads', column: 'platform', type: 'Platform' },
  { table: 'downloads', column: 'status', type: 'DownloadStatus', defaultValue: 'ACTIVE' },
  { table: 'solutions', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'cases', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'articles', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
  { table: 'faqs', column: 'status', type: 'ContentStatus', defaultValue: 'PUBLISHED' },
  { table: 'leads', column: 'source', type: 'LeadSource', defaultValue: 'WEBSITE' },
  { table: 'leads', column: 'status', type: 'LeadStatus', defaultValue: 'NEW' },
  { table: 'changelogs', column: 'status', type: 'ContentStatus', defaultValue: 'PUBLISHED' },
  { table: 'pages', column: 'status', type: 'ContentStatus', defaultValue: 'DRAFT' },
];

const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
const qualified = (table) => `${quote('public')}.${quote(table)}`;
const expected = (name) => new Set(enumDefinitions[name]);

const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('[ENUM REPAIR] 请先在 .env 中设置 DIRECT_URL 或 DATABASE_URL。');
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 10000 });
let client;
let transactionStarted = false;

try {
  client = await pool.connect();
  const identity = await client.query('SELECT current_database() AS database, current_user AS username, inet_server_addr()::text AS server');
  const { database, username, server } = identity.rows[0];
  console.log(`[ENUM REPAIR] 目标数据库：${database}；用户：${username}；服务器：${server || 'local socket'}`);

  // Explicit acknowledgement prevents running schema repair against an unintended DB.
  if (process.env.PG_ENUM_REPAIR_CONFIRM !== database) {
    throw new Error(`本脚本会修复 PostgreSQL 枚举列。请先备份数据库，并在当前 PowerShell 会话执行 $env:PG_ENUM_REPAIR_CONFIRM="${database}" 后重试。当前只确认了目标为 ${database}，尚未执行任何修改。`);
  }
  if (database !== 'ai' && process.env.PG_ENUM_REPAIR_ALLOW_NON_AI !== 'true') {
    throw new Error(`默认仅允许修复本地数据库 ai。当前目标为 ${database}；如确实要操作其他库，先确认备份，再同时设置 PG_ENUM_REPAIR_ALLOW_NON_AI=true 和 PG_ENUM_REPAIR_CONFIRM=${database}。`);
  }

  // Resolve the expected columns before changing anything. Don't silently repair an incomplete schema.
  const resolvedColumns = [];
  for (const entry of enumColumns) {
    const result = await client.query(
      `SELECT data_type, udt_name, column_default, is_nullable
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [entry.table, entry.column],
    );
    if (!result.rows.length) {
      throw new Error(`缺少字段 public.${entry.table}.${entry.column}。未执行任何修改；请先确认此数据库的表结构与 prisma/schema.prisma 一致。`);
    }
    resolvedColumns.push({ ...entry, ...result.rows[0] });
  }

  // Validate every existing value before creating types/converting columns.
  const invalidValues = [];
  for (const entry of resolvedColumns) {
    const valuesResult = await client.query(
      `SELECT DISTINCT ${quote(entry.column)}::text AS value
         FROM ${qualified(entry.table)}
        WHERE ${quote(entry.column)} IS NOT NULL`,
    );
    const allowed = expected(entry.type);
    for (const row of valuesResult.rows) {
      if (!allowed.has(row.value)) invalidValues.push(`${entry.table}.${entry.column}=${JSON.stringify(row.value)}（期望 ${entry.type}）`);
    }
  }
  if (invalidValues.length) {
    throw new Error(`发现不属于 Prisma 枚举的历史值，未执行任何修改：\n- ${invalidValues.join('\n- ')}\n请先人工确认这些值应映射到哪个合法状态，不要自动丢弃或改写业务数据。`);
  }

  // Existing types must contain all labels Prisma expects. Don't try to remove/recreate used types.
  for (const [typeName, labels] of Object.entries(enumDefinitions)) {
    const typeResult = await client.query(
      `SELECT t.oid
         FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = $1 AND t.typtype = 'e'`,
      [typeName],
    );
    if (!typeResult.rows.length) continue;
    const labelsResult = await client.query(
      `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
         JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = $1`,
      [typeName],
    );
    const existingLabels = new Set(labelsResult.rows.map((row) => row.enumlabel));
    const missingLabels = labels.filter((label) => !existingLabels.has(label));
    if (missingLabels.length) {
      throw new Error(`现有 public.${typeName} 缺少枚举值：${missingLabels.join(', ')}。为避免在现有类型上做不安全修改，脚本停止；请先备份并单独评估该类型。`);
    }
  }

  await client.query('BEGIN');
  transactionStarted = true;

  for (const [typeName, labels] of Object.entries(enumDefinitions)) {
    const typeResult = await client.query(
      `SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typname = $1 AND t.typtype = 'e'`,
      [typeName],
    );
    if (typeResult.rowCount) continue;
    const valuesSql = labels.map((label) => `'${label.replaceAll("'", "''")}'`).join(', ');
    await client.query(`CREATE TYPE ${qualified(typeName)} AS ENUM (${valuesSql})`);
    console.log(`[ENUM REPAIR] 已创建 public.${typeName}`);
  }

  for (const entry of resolvedColumns) {
    const currentType = await client.query(
      `SELECT udt_name, data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [entry.table, entry.column],
    );
    const actual = currentType.rows[0];
    if (actual.data_type !== 'USER-DEFINED' || actual.udt_name !== entry.type) {
      await client.query(`ALTER TABLE ${qualified(entry.table)} ALTER COLUMN ${quote(entry.column)} DROP DEFAULT`);
      await client.query(
        `ALTER TABLE ${qualified(entry.table)} ALTER COLUMN ${quote(entry.column)} TYPE ${qualified(entry.type)} USING ${quote(entry.column)}::text::${qualified(entry.type)}`,
      );
      console.log(`[ENUM REPAIR] 已转换 ${entry.table}.${entry.column} -> ${entry.type}`);
    }
    if (entry.defaultValue) {
      await client.query(
        `ALTER TABLE ${qualified(entry.table)} ALTER COLUMN ${quote(entry.column)} SET DEFAULT '${entry.defaultValue}'::${qualified(entry.type)}`,
      );
    } else {
      await client.query(`ALTER TABLE ${qualified(entry.table)} ALTER COLUMN ${quote(entry.column)} DROP DEFAULT`);
    }
  }

  await client.query('COMMIT');
  transactionStarted = false;
  console.log('\n[ENUM REPAIR] 成功。已修复 PostgreSQL 枚举类型和对应列类型；没有删除或更新任何业务行。');
  console.log('[ENUM REPAIR] 下一步运行：npm.cmd run db:check');
} catch (error) {
  if (client && transactionStarted) {
    try { await client.query('ROLLBACK'); } catch {}
  }
  console.error(`\n[ENUM REPAIR] 已停止：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (client) client.release();
  await pool.end();
}
