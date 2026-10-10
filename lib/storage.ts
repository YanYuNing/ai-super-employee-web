import path from 'node:path';
import { createHmac } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { decryptStorageSecret, encryptStorageSecret } from '@/lib/storage-crypto';
import { detectFileType } from '@/lib/file-types';
import { supabasePublicObjectUrl } from '@/lib/supabase-storage';

export type StorageProvider = 'LOCAL' | 'OSS' | 'SUPABASE';

export type StorageConfig = {
  id: number;
  provider: StorageProvider;
  endpoint: string | null;
  region: string | null;
  bucket: string | null;
  accessKeyId: string | null;
  secretEncrypted: string | null;
  basePath: string | null;
  cdnUrl: string | null;
  maxFileSizeMb: number;
  allowedTypes: unknown;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function base64url(input: string) {
  return Buffer.from(input).toString('base64url');
}

function cleanNullable(value?: string | null) {
  const text = String(value ?? '').trim();
  return text ? text : null;
}

function normalizeProvider(value: unknown): StorageProvider {
  const provider = String(value || '').toUpperCase();
  if (provider === 'OSS') return 'OSS';
  if (provider === 'SUPABASE') return 'SUPABASE';
  return 'LOCAL';
}

function rowToConfig(row: any): StorageConfig | null {
  if (!row) return null;
  return {
    id: Number(row.id),
    provider: normalizeProvider(row.provider),
    endpoint: row.endpoint ?? null,
    region: row.region ?? null,
    bucket: row.bucket ?? null,
    accessKeyId: row.accessKeyId ?? null,
    secretEncrypted: row.secretEncrypted ?? null,
    basePath: row.basePath ?? null,
    cdnUrl: row.cdnUrl ?? null,
    maxFileSizeMb: Number(row.maxFileSizeMb || 2048),
    allowedTypes: row.allowedTypes ?? null,
    enabled: row.enabled !== false,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const STORAGE_CONFIG_DEFAULT_ALLOWED_TYPES = ['IMAGE','VIDEO','AUDIO','ARCHIVE','PDF','WORD','SPREADSHEET','PRESENTATION','MARKDOWN','TEXT','FILE'];

/**
 * 数据库结构由 Prisma schema 管理。本函数只作为旧接口的兼容入口，不再运行 MySQL 专属 ALTER TABLE。
 * PostgreSQL 首次部署请运行 `npm.cmd run db:push:supabase`。
 */
export async function ensureFileStorageSchema() {
  return { repaired: true, managedBy: 'prisma' as const };
}

export async function ensureStorageConfigTable() {
  const delegate = (prisma as any).storageConfig;
  if (!delegate?.upsert) {
    throw new Error('Prisma StorageConfig 模型不可用，请运行 npm.cmd run prisma:generate。');
  }
  const before = await delegate.findUnique({ where: { id: 1 } });
  if (before) return { created: false };
  await delegate.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      provider: 'LOCAL',
      maxFileSizeMb: 2048,
      allowedTypes: STORAGE_CONFIG_DEFAULT_ALLOWED_TYPES,
      enabled: true,
    },
    update: {},
  });
  return { created: true };
}

export async function getStorageConfig(): Promise<StorageConfig | null> {
  await ensureStorageConfigTable();
  const row = await (prisma as any).storageConfig.findUnique({ where: { id: 1 } });
  return rowToConfig(row);
}

export async function saveStorageConfig(input: {
  provider: StorageProvider;
  endpoint?: string | null;
  region?: string | null;
  bucket?: string | null;
  accessKeyId?: string | null;
  secret?: string | null;
  basePath?: string | null;
  cdnUrl?: string | null;
  maxFileSizeMb?: number;
  allowedTypes?: unknown;
  enabled?: boolean;
}) {
  const current = await getStorageConfig();
  const provider = normalizeProvider(input.provider);
  const allowedTypes = input.allowedTypes === undefined ? current?.allowedTypes ?? STORAGE_CONFIG_DEFAULT_ALLOWED_TYPES : input.allowedTypes;
  const basePath = sanitizeRelativeFolder(input.basePath || '');
  const maxFileSizeMb = Math.max(1, Math.min(10240, Number(input.maxFileSizeMb || 2048)));
  const enabled = input.enabled !== false;

  let endpoint = cleanNullable(input.endpoint);
  let region = cleanNullable(input.region);
  let bucket = cleanNullable(input.bucket);
  let accessKeyId = cleanNullable(input.accessKeyId);
  let secretEncrypted = input.secret?.trim() ? encryptStorageSecret(input.secret.trim()) : current?.secretEncrypted ?? null;
  let cdnUrl = cleanNullable(input.cdnUrl);

  if (provider === 'OSS') {
    if (!endpoint || !bucket || !accessKeyId || !secretEncrypted) {
      throw new Error('阿里云 OSS 配置不完整：Endpoint、Bucket、AccessKey ID、AccessKey Secret 均为必填。');
    }
  } else if (provider === 'SUPABASE') {
    endpoint = cleanNullable(process.env.SUPABASE_URL);
    bucket = bucket || cleanNullable(process.env.SUPABASE_STORAGE_BUCKET) || 'site-assets';
    accessKeyId = null;
    secretEncrypted = null; // Supabase service role is stored in server environment only.
    if (!endpoint || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase Storage 配置不完整：请在服务器/Vercel 环境设置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 SUPABASE_STORAGE_BUCKET。');
    }
    region = null;
    cdnUrl = null;
  } else {
    endpoint = null;
    region = null;
    bucket = null;
    accessKeyId = null;
    secretEncrypted = null;
    cdnUrl = null;
  }

  const data: any = {
    provider,
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretEncrypted,
    basePath: basePath || null,
    cdnUrl,
    maxFileSizeMb,
    allowedTypes: allowedTypes ?? undefined,
    enabled,
  };
  const row = await (prisma as any).storageConfig.upsert({
    where: { id: 1 },
    create: { id: 1, ...data },
    update: data,
  });
  return rowToConfig(row);
}

export function storageProviderLabel(provider?: string | null) {
  const value = normalizeProvider(provider);
  if (value === 'OSS') return '阿里云 OSS';
  if (value === 'SUPABASE') return 'Supabase Storage';
  return '本地存储';
}

export function getLocalUploadRoot() {
  const configured = String(process.env.LOCAL_UPLOAD_ROOT || 'public/uploads').trim() || 'public/uploads';
  return path.isAbsolute(configured) ? configured : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

export function sanitizeRelativeFolder(folder: string) {
  return String(folder || '')
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
}

export function resolveStorageFolder(config: StorageConfig | null, folder = 'uploads') {
  const clean = sanitizeRelativeFolder(folder || 'uploads') || 'uploads';
  const base = sanitizeRelativeFolder(config?.basePath || '');
  return base ? `${base}/${clean}` : clean;
}

export function resolveLocalStoragePath(config: StorageConfig | null, storageKey: string) {
  const key = storageKey.replace(/^\/+/, '').replace(/\.\./g, '-');
  const root = getLocalUploadRoot();
  return path.join(root, key);
}

export function localPublicUrl(storageKey: string) {
  return `/uploads/${storageKey.split('/').map(encodeURIComponent).join('/')}`;
}

export function publicUrl(config: StorageConfig | null, key: string) {
  const clean = key.replace(/^\/+/, '');
  if (config?.cdnUrl) return `${String(config.cdnUrl).replace(/\/$/, '')}/${clean}`;
  if (config?.provider === 'OSS' && config.endpoint && config.bucket) {
    return `https://${config.bucket}.${String(config.endpoint).replace(/^https?:\/\//, '').replace(/\/$/, '')}/${clean}`;
  }
  if (config?.provider === 'SUPABASE') return supabasePublicObjectUrl(clean, config.bucket, config.endpoint);
  return localPublicUrl(clean);
}

export function ossPutUrl(config: StorageConfig | null, key: string, expires = 900) {
  if (!config?.accessKeyId || !config?.secretEncrypted || !config?.bucket || !config?.endpoint) {
    throw new Error('OSS 配置不完整：Endpoint、Bucket、AccessKey ID、AccessKey Secret 均需要配置。');
  }
  const endpoint = String(config.endpoint).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const exp = Math.floor(Date.now() / 1000) + expires;
  const resource = `/${config.bucket}/${key.replace(/^\//, '')}`;
  const stringToSign = `PUT\n\n\n${exp}\n${resource}`;
  const signature = createHmac('sha1', decryptStorageSecret(String(config.secretEncrypted))).update(stringToSign).digest('base64');
  const url = `https://${config.bucket}.${endpoint}/${key.replace(/^\//, '')}?OSSAccessKeyId=${encodeURIComponent(config.accessKeyId)}&Expires=${exp}&Signature=${encodeURIComponent(signature)}`;
  return { url, expiresAt: exp };
}

export function ossSignedUrl(config: StorageConfig | null, key: string, method: 'GET' | 'PUT' | 'DELETE', expires = 300) {
  if (!config?.accessKeyId || !config?.secretEncrypted || !config?.bucket || !config?.endpoint) {
    throw new Error('OSS 配置不完整：Endpoint、Bucket、AccessKey ID、AccessKey Secret 均需要配置。');
  }
  const endpoint = String(config.endpoint).replace(/^https?:\/\//, '').replace(/\/$/, '');
  const exp = Math.floor(Date.now() / 1000) + expires;
  const cleanKey = key.replace(/^\//, '');
  const resource = `/${config.bucket}/${cleanKey}`;
  const stringToSign = `${method}\n\n\n${exp}\n${resource}`;
  const signature = createHmac('sha1', decryptStorageSecret(String(config.secretEncrypted))).update(stringToSign).digest('base64');
  const url = `https://${config.bucket}.${endpoint}/${cleanKey}?OSSAccessKeyId=${encodeURIComponent(config.accessKeyId)}&Expires=${exp}&Signature=${encodeURIComponent(signature)}`;
  return { url, expiresAt: exp };
}

export function ossGetUrl(config: StorageConfig | null, key: string, expires = 300) {
  return ossSignedUrl(config, key, 'GET', expires);
}

export function ossDeleteUrl(config: StorageConfig | null, key: string, expires = 300) {
  return ossSignedUrl(config, key, 'DELETE', expires);
}

export function storageKeyFor(name: string, folder = 'uploads') {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(-120);
  return `${sanitizeRelativeFolder(folder).replace(/^\/+|\/+$/g, '') || 'uploads'}/${Date.now()}-${base64url(safe).slice(0, 16)}-${safe}`;
}

export function parseAllowedTypes(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean).map(x => x.toUpperCase());
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).map(x => x.toUpperCase());
    } catch {
      return value.split(',').map(x => x.trim()).filter(Boolean).map(x => x.toUpperCase());
    }
  }
  return [];
}

export function validateUploadPolicy(
  config: StorageConfig | null,
  input: { name: string; size: number; mimeType?: string | null; assetType?: string | null },
) {
  if (!config?.enabled) throw new Error('文件存储当前未启用，请先到“文件存储”中启用本地存储、OSS 或 Supabase Storage。');
  const maxBytes = Math.max(1, Number(config.maxFileSizeMb || 2048)) * 1024 * 1024;
  if (input.size > maxBytes) throw new Error(`文件“${input.name}”超过当前存储上限 ${config.maxFileSizeMb || 2048}MB。`);
  const detected = String(input.assetType || detectFileType(input.name, input.mimeType || '')).toUpperCase();
  const allowed = parseAllowedTypes(config.allowedTypes);
  if (allowed.length && !allowed.includes(detected)) {
    throw new Error(`当前存储策略不允许上传“${detected}”类型文件。允许类型：${allowed.join('、')}`);
  }
  return { assetType: detected, maxBytes };
}
