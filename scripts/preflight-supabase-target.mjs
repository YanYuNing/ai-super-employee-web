import 'dotenv/config';

function parseConnection(name) {
  const raw = String(process.env[name] || '').trim();
  if (!raw || /REPLACE_|PROJECT_REF|DB_PASSWORD|POOLER_HOST/i.test(raw)) {
    throw new Error(`${name} 尚未填写真实连接串。请从 Supabase Dashboard > Connect 复制连接信息。`);
  }
  let url;
  try { url = new URL(raw); } catch { throw new Error(`${name} 不是合法的 PostgreSQL URL。`); }
  if (!/^postgres(ql)?:$/i.test(url.protocol)) throw new Error(`${name} 必须使用 postgresql:// 或 postgres://。`);
  return {
    host: url.hostname.toLowerCase(),
    port: url.port || '5432',
    database: decodeURIComponent(url.pathname.replace(/^\//, '')).split('/')[0],
  };
}

const source = parseConnection('LOCAL_SOURCE_DATABASE_URL');
const runtime = parseConnection('DATABASE_URL');
const direct = parseConnection('DIRECT_URL');
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);
if (source.database !== 'ai' || !localHosts.has(source.host)) {
  throw new Error(`为保护现有数据，LOCAL_SOURCE_DATABASE_URL 必须指向本机 ai 数据库；当前为 ${source.host}/${source.database}。`);
}
for (const [name, target] of [['DATABASE_URL', runtime], ['DIRECT_URL', direct]]) {
  if (!(target.host.endsWith('.supabase.co') || target.host.endsWith('.pooler.supabase.com'))) {
    throw new Error(`${name} 目前不是 Supabase 主机（${target.host}）。为避免误改本地 ai，请先把目标连接串换为 Supabase Dashboard > Connect 提供的地址。`);
  }
  if (localHosts.has(target.host) || target.database === 'ai' || target.database === 'ai_migration_test') {
    throw new Error(`${name} 指向了本地数据库或测试库，已停止以防误操作：${target.host}/${target.database}`);
  }
}
if (runtime.host === source.host && runtime.port === source.port && runtime.database === source.database) {
  throw new Error('运行时 DATABASE_URL 与本地源库指向相同位置；已停止。');
}
if (direct.host === source.host && direct.port === source.port && direct.database === source.database) {
  throw new Error('DIRECT_URL 与本地源库指向相同位置；已停止。');
}
console.log('[SUPABASE PREFLIGHT] 通过');
console.log(`[SUPABASE PREFLIGHT] 本机只读源库：${source.host}:${source.port}/${source.database}`);
console.log(`[SUPABASE PREFLIGHT] 运行时目标：${runtime.host}:${runtime.port}/${runtime.database}`);
console.log(`[SUPABASE PREFLIGHT] Schema/数据迁移目标：${direct.host}:${direct.port}/${direct.database}`);
console.log('[SUPABASE PREFLIGHT] 已确认不会把本机 ai 当作写入目标。');
