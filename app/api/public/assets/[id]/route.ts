import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectFileType } from '@/lib/file-types';
import { supabasePublicObjectUrl } from '@/lib/supabase-storage';
import {
  ensureFileStorageSchema,
  getLocalUploadRoot,
  getStorageConfig,
  ossGetUrl,
  resolveLocalStoragePath,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function contentDisposition(name: string) {
  const safe = String(name || 'file').replace(/[\"\r\n]/g, '_');
  return `inline; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function inferMimeType(asset: any) {
  const existing = String(asset?.mimeType || '').trim().toLowerCase();
  if (existing && existing !== 'application/octet-stream') return existing;
  const name = String(asset?.originalName || asset?.name || asset?.storageKey || '');
  const detected = detectFileType(name, existing);
  const extension = String(asset?.extension || name.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', m3u8: 'application/vnd.apple.mpegurl',
    mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
    pdf: 'application/pdf', json: 'application/json', txt: 'text/plain', md: 'text/markdown',
  };
  if (map[extension]) return map[extension];
  if (detected === 'VIDEO') return 'video/mp4';
  if (detected === 'AUDIO') return 'audio/mpeg';
  if (detected === 'IMAGE') return 'image/png';
  if (detected === 'PDF') return 'application/pdf';
  return existing || 'application/octet-stream';
}

function parseRange(value: string | null, size: number) {
  if (!value || !/^bytes=\d*-\d*$/i.test(value)) return null;
  const raw = value.replace(/^bytes=/i, '');
  const [startRaw, endRaw] = raw.split('-');
  let start = startRaw ? Number(startRaw) : NaN;
  let end = endRaw ? Number(endRaw) : NaN;

  if (Number.isNaN(start)) {
    const suffixLength = Number(endRaw);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    if (start >= size) return 'INVALID' as const;
    if (Number.isNaN(end) || end >= size) end = size - 1;
  }
  return { start, end };
}

async function loadAsset(request: Request, params: Promise<{ id: string }>) {
  await ensureFileStorageSchema();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return { response: NextResponse.json({ success: false, message: '资源 ID 无效' }, { status: 400 }) };
  }
  const asset = await prisma.mediaAsset.findUnique({ where: { id } }) as any;
  if (!asset || asset.isPublic === false) {
    return { response: NextResponse.json({ success: false, message: '资源不存在或未公开' }, { status: 404 }) };
  }
  return { asset };
}

export async function HEAD(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const loaded = await loadAsset(request, params);
    if (loaded.response) return loaded.response;
    const asset = loaded.asset;
    const config = await getStorageConfig();
    const provider = String(asset.storageProvider || config?.provider || 'LOCAL').toUpperCase();
    const key = String(asset.storageKey || '').replace(/^\/+/, '');

    if (provider === 'SUPABASE') {
      if (!key) {
        const target = asset.url ? new URL(String(asset.url), new URL(request.url).origin) : null;
        return target ? NextResponse.redirect(target, 302) : NextResponse.json({ success: false, message: 'Supabase 资源缺少存储 Key' }, { status: 404 });
      }
      return NextResponse.redirect(supabasePublicObjectUrl(key, config?.bucket, config?.endpoint), 302);
    }

    if (provider === 'OSS') {
      if (!key) {
        const target = asset.url ? new URL(String(asset.url), new URL(request.url).origin) : null;
        return target ? NextResponse.redirect(target, 302) : NextResponse.json({ success: false, message: 'OSS 资源缺少存储 Key' }, { status: 404 });
      }
      const signed = ossGetUrl(config, key, 300);
      return NextResponse.redirect(signed.url, 302);
    }

    if (!key) {
      const target = asset.url ? new URL(String(asset.url), new URL(request.url).origin) : null;
      return target ? NextResponse.redirect(target, 302) : NextResponse.json({ success: false, message: '本地资源缺少存储 Key' }, { status: 404 });
    }

    const root = getLocalUploadRoot();
    const filePath = resolveLocalStoragePath(config, key);
    const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith(`${normalizedRoot}/`) && normalizedPath !== normalizedRoot) {
      return NextResponse.json({ success: false, message: '资源路径非法' }, { status: 400 });
    }
    const info = await stat(filePath);
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': inferMimeType(asset),
        'Content-Length': String(info.size),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': contentDisposition(String(asset.originalName || asset.name || 'file')),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/ENOENT|no such file/i.test(message)) return NextResponse.json({ success: false, message: '文件不存在' }, { status: 404 });
    return NextResponse.json({ success: false, message: '读取资源失败' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const loaded = await loadAsset(request, params);
    if (loaded.response) return loaded.response;
    const asset = loaded.asset;
    const config = await getStorageConfig();
    const provider = String(asset.storageProvider || config?.provider || 'LOCAL').toUpperCase();
    const key = String(asset.storageKey || '').replace(/^\/+/, '');

    if (provider === 'SUPABASE') {
      if (!key) {
        const target = asset.url ? new URL(String(asset.url), new URL(request.url).origin) : null;
        return target ? NextResponse.redirect(target, 302) : NextResponse.json({ success: false, message: 'Supabase 资源缺少存储 Key' }, { status: 404 });
      }
      return NextResponse.redirect(supabasePublicObjectUrl(key, config?.bucket, config?.endpoint), 302);
    }

    if (provider === 'OSS') {
      if (!key) {
        if (asset.url) return NextResponse.redirect(new URL(String(asset.url), new URL(request.url).origin));
        return NextResponse.json({ success: false, message: 'OSS 资源缺少存储 Key' }, { status: 404 });
      }
      const signed = ossGetUrl(config, key, 300);
      return NextResponse.redirect(signed.url, 302);
    }

    if (!key) {
      if (asset.url) return NextResponse.redirect(new URL(String(asset.url), new URL(request.url).origin));
      return NextResponse.json({ success: false, message: '本地资源缺少存储 Key' }, { status: 404 });
    }

    const root = getLocalUploadRoot();
    const filePath = resolveLocalStoragePath(config, key);
    const normalizedRoot = root.replace(/\\/g, '/').replace(/\/$/, '');
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith(`${normalizedRoot}/`) && normalizedPath !== normalizedRoot) {
      return NextResponse.json({ success: false, message: '资源路径非法' }, { status: 400 });
    }

    const info = await stat(filePath);
    const range = parseRange(request.headers.get('range'), info.size);
    const mimeType = inferMimeType(asset);
    const disposition = contentDisposition(String(asset.originalName || asset.name || 'file'));
    const commonHeaders = {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': disposition,
    };

    if (range === 'INVALID') {
      return new NextResponse(null, {
        status: 416,
        headers: { ...commonHeaders, 'Content-Range': `bytes */${info.size}` },
      });
    }

    if (range) {
      const length = range.end - range.start + 1;
      const stream = createReadStream(filePath, { start: range.start, end: range.end });
      return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 206,
        headers: {
          ...commonHeaders,
          'Content-Length': String(length),
          'Content-Range': `bytes ${range.start}-${range.end}/${info.size}`,
        },
      });
    }

    // Stream the file instead of buffering it into memory. This is important for video playback.
    const stream = createReadStream(filePath);
    return new NextResponse(Readable.toWeb(stream) as unknown as ReadableStream, {
      status: 200,
      headers: { ...commonHeaders, 'Content-Length': String(info.size) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/ENOENT|no such file/i.test(message)) return NextResponse.json({ success: false, message: '文件不存在' }, { status: 404 });
    return NextResponse.json({ success: false, message: '读取资源失败' }, { status: 500 });
  }
}
