import { prisma } from '@/lib/prisma';

export type ResolvedPublicAsset = {
  url: string | null;
  name: string | null;
  mimeType: string | null;
  type: string | null;
};

function normalizeType(value?: string | null) {
  const text = String(value || '').trim().toUpperCase();
  return text || null;
}

function typeFromUrl(source: string) {
  const value = source.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)(?:[?#].*)?$/.test(value)) return 'VIDEO';
  if (/\.(m3u8)(?:[?#].*)?$/.test(value)) return 'VIDEO';
  if (/\.(mp3|wav|ogg|m4a)(?:[?#].*)?$/.test(value)) return 'AUDIO';
  if (/\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/.test(value)) return 'IMAGE';
  if (/\.pdf(?:[?#].*)?$/.test(value)) return 'PDF';
  if (/\.(zip|rar|7z|tar|gz|tgz)(?:[?#].*)?$/.test(value)) return 'ARCHIVE';
  return null;
}

function typeFromName(name: string, mimeType = '', extension = '', fallbackUrl = '') {
  const mime = String(mimeType || '').toLowerCase();
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('audio/')) return 'AUDIO';
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('zip') || mime.includes('compressed')) return 'ARCHIVE';
  const candidate = `${name} ${extension} ${fallbackUrl}`.toLowerCase();
  if (/\.(mp4|webm|mov|m4v|m3u8)(?:[?#].*)?(?:\s|$)/.test(candidate) || /(?:^|\s)(mp4|webm|mov|m4v|m3u8)(?:\s|$)/.test(candidate)) return 'VIDEO';
  if (/\.(mp3|wav|ogg|m4a)(?:[?#].*)?(?:\s|$)/.test(candidate)) return 'AUDIO';
  if (/\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?(?:\s|$)/.test(candidate)) return 'IMAGE';
  if (/\.pdf(?:[?#].*)?(?:\s|$)/.test(candidate)) return 'PDF';
  if (/\.(zip|rar|7z|tar|gz|tgz)(?:[?#].*)?(?:\s|$)/.test(candidate)) return 'ARCHIVE';
  return null;
}

function inferAssetType(asset: any, source: string) {
  const inferred = typeFromName(
    String(asset?.originalName || asset?.name || ''),
    String(asset?.mimeType || ''),
    String(asset?.extension || ''),
    String(asset?.storageKey || source || ''),
  ) || typeFromUrl(source);
  // Prefer reliable media inference over a loose historical DB type such as FILE/DOCUMENT.
  if (inferred) return inferred;
  const stored = normalizeType(asset?.type);
  return stored;
}

export async function resolvePublicAsset(source?: string | null): Promise<ResolvedPublicAsset> {
  const value = String(source || '').trim();
  if (!value) return { url: null, name: null, mimeType: null, type: null };

  const idMatch = value.match(/\/api\/public\/assets\/(\d+)(?:[/?#]|$)/i);
  if (idMatch) {
    const id = Number(idMatch[1]);
    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      select: { id: true, name: true, originalName: true, mimeType: true, type: true, extension: true, storageKey: true },
    }).catch(() => null);
    return {
      url: value,
      name: asset?.originalName || asset?.name || null,
      mimeType: asset?.mimeType || null,
      type: inferAssetType(asset, value),
    };
  }

  // Historical uploads used /uploads/... or stored the same public URL directly.
  // Convert those assets to the controlled public endpoint so local files support range requests
  // and OSS files can be redirected through a fresh signed GET URL.
  if (/^\/uploads\//i.test(value)) {
    const asset = await prisma.mediaAsset.findFirst({
      where: { url: value },
      select: { id: true, name: true, originalName: true, mimeType: true, type: true, extension: true, storageKey: true },
    }).catch(() => null);
    if (asset) {
      return {
        url: `/api/public/assets/${asset.id}`,
        name: asset.originalName || asset.name || null,
        mimeType: asset.mimeType || null,
        type: inferAssetType(asset, value),
      };
    }
  }

  const asset = await prisma.mediaAsset.findFirst({
    where: { url: value },
    select: { id: true, name: true, originalName: true, mimeType: true, type: true, extension: true, storageKey: true },
  }).catch(() => null);
  if (asset) {
    return {
      url: `/api/public/assets/${asset.id}`,
      name: asset.originalName || asset.name || null,
      mimeType: asset.mimeType || null,
      type: inferAssetType(asset, value),
    };
  }

  return { url: value, name: null, mimeType: null, type: typeFromUrl(value) };
}
