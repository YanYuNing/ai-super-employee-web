/** Server-only Supabase Storage REST helpers. SUPABASE_SERVICE_ROLE_KEY must never be exposed to a browser. */

function requiredEnv() {
  const baseUrl = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const bucket = String(process.env.SUPABASE_STORAGE_BUCKET || 'site-assets').trim();
  if (!/^https:\/\//i.test(baseUrl) || !serviceKey || !bucket) {
    throw new Error('Supabase Storage 未配置完整：请设置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 SUPABASE_STORAGE_BUCKET。');
  }
  return { baseUrl, serviceKey, bucket };
}

function encodeObjectKey(key: string) {
  return String(key).split('/').filter(Boolean).map((part) => encodeURIComponent(part)).join('/');
}

function authHeaders(serviceKey: string) {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
}

export function getSupabaseStorageEnv() {
  const { baseUrl, bucket } = requiredEnv();
  return { baseUrl, bucket };
}

export function supabasePublicObjectUrl(key: string, bucketOverride?: string | null, baseUrlOverride?: string | null) {
  const env = requiredEnv();
  const baseUrl = String(baseUrlOverride || env.baseUrl).replace(/\/$/, '');
  const bucket = String(bucketOverride || env.bucket);
  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`;
}

export async function uploadSupabaseObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType = 'application/octet-stream',
  options: { upsert?: boolean; bucket?: string | null } = {},
) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(options.bucket || defaultBucket);
  const target = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`;
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      ...authHeaders(serviceKey),
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': options.upsert ? 'true' : 'false',
      'cache-control': '31536000',
    },
    body: Buffer.from(body),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Supabase Storage 上传失败（HTTP ${response.status}）${details ? `：${details.slice(0, 240)}` : ''}`);
  }
  return { bucket, key, url: supabasePublicObjectUrl(key, bucket, baseUrl) };
}

export async function deleteSupabaseObject(key: string, bucketOverride?: string | null) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(bucketOverride || defaultBucket);
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: 'DELETE',
    headers: { ...authHeaders(serviceKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [String(key).replace(/^\/+/, '')] }),
  });
  if (!response.ok && response.status !== 404) {
    const details = await response.text().catch(() => '');
    throw new Error(`Supabase Storage 删除失败（HTTP ${response.status}）${details ? `：${details.slice(0, 240)}` : ''}`);
  }
}

export async function createSupabaseSignedUrl(key: string, expiresInSeconds = 300, bucketOverride?: string | null) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(bucketOverride || defaultBucket);
  const response = await fetch(`${baseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`, {
    method: 'POST',
    headers: { ...authHeaders(serviceKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: Math.max(30, Math.min(3600, expiresInSeconds)) }),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Supabase Storage 签名地址生成失败（HTTP ${response.status}）${details ? `：${details.slice(0, 200)}` : ''}`);
  }
  const result = await response.json() as { signedURL?: string; signedUrl?: string };
  const signed = result.signedURL || result.signedUrl;
  if (!signed) throw new Error('Supabase Storage 未返回签名地址。');
  if (/^https?:\/\//i.test(signed)) return signed;
  return `${baseUrl}/storage/v1${signed.startsWith('/') ? signed : `/${signed}`}`;
}

export async function checkSupabaseBucket(bucketOverride?: string | null) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(bucketOverride || defaultBucket);
  const response = await fetch(`${baseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`, {
    headers: authHeaders(serviceKey),
    cache: 'no-store',
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    let body: Record<string, unknown> = {};
    try { body = details ? JSON.parse(details) as Record<string, unknown> : {}; } catch { /* keep raw response */ }
    const missing = response.status === 404
      || String(body.statusCode || '') === '404'
      || String(body.code || '') === 'NoSuchBucket'
      || /bucket not found/i.test(String(body.message || ''));
    if (missing) throw new Error(`Supabase Storage Bucket「${bucket}」不存在。请先运行 npm.cmd run storage:setup:supabase。`);
    throw new Error(`Supabase Storage Bucket 检查失败（HTTP ${response.status}）${details ? `：${details.slice(0, 200)}` : ''}`);
  }
  const data = await response.json().catch(() => ({})) as { public?: boolean; name?: string; id?: string };
  return { bucket, isPublic: data.public === true, name: data.name || data.id || bucket };
}

export async function createSupabaseSignedUploadUrl(key: string, bucketOverride?: string | null) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(bucketOverride || defaultBucket);
  const path = encodeObjectKey(key);
  const endpoint = `${baseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${path}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { ...authHeaders(serviceKey), 'Content-Type': 'application/json' },
    body: JSON.stringify({ upsert: false }),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Supabase Storage 创建上传签名失败（HTTP ${response.status}）${details ? `：${details.slice(0, 200)}` : ''}`);
  }
  const result = await response.json() as { url?: string; signedURL?: string; token?: string };
  let url = result.url || result.signedURL;
  if (!url) throw new Error('Supabase Storage 未返回上传地址。');
  if (!/^https?:\/\//i.test(url)) url = `${baseUrl}/storage/v1${url.startsWith('/') ? url : `/${url}`}`;
  const parsed = new URL(url);
  const token = result.token || parsed.searchParams.get('token') || '';
  if (!token) throw new Error('Supabase Storage 上传地址缺少 token。');
  return { url: parsed.toString(), token, bucket, key };
}


/** Stream larger existing local assets to Supabase without buffering the entire file in RAM. */
export async function uploadSupabaseStreamObject(
  key: string,
  body: NodeJS.ReadableStream,
  sizeBytes: number,
  contentType = 'application/octet-stream',
  options: { upsert?: boolean; bucket?: string | null } = {},
) {
  const { baseUrl, serviceKey, bucket: defaultBucket } = requiredEnv();
  const bucket = String(options.bucket || defaultBucket);
  const target = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeObjectKey(key)}`;
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      ...authHeaders(serviceKey),
      'Content-Type': contentType || 'application/octet-stream',
      'Content-Length': String(sizeBytes),
      'x-upsert': options.upsert ? 'true' : 'false',
      'cache-control': '31536000',
    },
    body: body as any,
    duplex: 'half',
  } as any);
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Supabase Storage 流式上传失败（HTTP ${response.status}）${details ? `：${details.slice(0, 240)}` : ''}`);
  }
  return { bucket, key, url: supabasePublicObjectUrl(key, bucket, baseUrl) };
}
