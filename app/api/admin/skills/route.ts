import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/admin-auth';
import { ensureFileStorageSchema } from '@/lib/storage';

function serialize(v: unknown): unknown { if (typeof v === 'bigint') return v.toString(); if (Array.isArray(v)) return v.map(serialize); if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,serialize(x)])); return v; }

export async function GET(req: Request) { const admin = await checkPermission('skill.view'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403}); await ensureFileStorageSchema();
  const u = new URL(req.url); const q = u.searchParams.get('q')?.trim() || ''; const status = u.searchParams.get('status') || '';
  const where: any = {}; if (q) where.OR = [{name:{contains:q}},{slug:{contains:q}},{description:{contains:q}}]; if (status) where.status = status;
  const data = await prisma.skill.findMany({ where, orderBy:[{sortOrder:'asc'},{updatedAt:'desc'}], include:{versions:{orderBy:{createdAt:'desc'}}} });
  return NextResponse.json({success:true,data:serialize(data)});
}

export async function POST(req: Request) { const admin = await checkPermission('skill.create'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403}); await ensureFileStorageSchema();
  try { const b=await req.json(); if(!b.name||!b.slug) return NextResponse.json({success:false,message:'名称和 Slug 为必填项'},{status:400});
    const data=await prisma.skill.create({data:{name:b.name,slug:b.slug,description:b.description||null,content:b.content||null,icon:b.icon||null,coverImage:b.coverImage||null,version:b.version||null,status:b.status||'DRAFT',downloadCount:Number(b.downloadCount||0),sortOrder:Number(b.sortOrder||0),tags:typeof b.tags==='string'?JSON.parse(b.tags||'null'):b.tags||null,seoTitle:b.seoTitle||null,seoDescription:b.seoDescription||null}});
    return NextResponse.json({success:true,data:serialize(data)});
  } catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:'创建 Skill 失败'},{status:400});}
}
