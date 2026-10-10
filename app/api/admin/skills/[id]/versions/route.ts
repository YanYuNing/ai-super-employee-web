import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';
import { ensureFileStorageSchema } from '@/lib/storage';

function serialize(v: unknown): unknown {
  if (typeof v === 'bigint') return v.toString();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialize(x)]));
  return v;
}

function isSkillArchive(fileName: string, mimeType = '') {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext) || /zip|compressed|x-7z-compressed|x-rar/i.test(mimeType);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkPermission('skill.upload');
  if (!admin) return NextResponse.json({ success: false, message: '没有权限' }, { status: 403 });

  try {
    await ensureFileStorageSchema();
    const skillId = Number((await params).id);
    const b = await req.json();
    if (!b.version || !b.fileUrl) return NextResponse.json({ success: false, message: '版本号和 Skill 压缩包不能为空' }, { status: 400 });
    if (!isSkillArchive(String(b.fileName || ''), String(b.mimeType || ''))) {
      return NextResponse.json({ success: false, message: 'Skill 版本文件必须是 ZIP / RAR / 7Z / TAR 等压缩包。' }, { status: 400 });
    }

    const data = await prisma.$transaction(async tx => {
      if (b.isLatest !== false) await tx.skillVersion.updateMany({ where: { skillId }, data: { isLatest: false } });
      const version = await tx.skillVersion.create({
        data: {
          skillId,
          version: String(b.version).trim(),
          fileUrl: String(b.fileUrl),
          fileSize: b.fileSize ? BigInt(b.fileSize) : null,
          releaseNotes: b.releaseNotes || null,
          isLatest: b.isLatest !== false,
          fileAssetId: b.fileAssetId ? Number(b.fileAssetId) : null,
          fileName: b.fileName || null,
          mimeType: b.mimeType || null,
        } as any,
      });
      if (b.isLatest !== false) await tx.skill.update({ where: { id: skillId }, data: { version: String(b.version).trim() } });
      return version;
    });

    return NextResponse.json({ success: true, data: serialize(data) });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : '创建 Skill 版本失败' }, { status: 400 });
  }
}
