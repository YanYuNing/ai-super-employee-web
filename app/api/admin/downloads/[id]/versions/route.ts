import { NextResponse } from 'next/server'; import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-auth';
function serialize(v:unknown):unknown{if(typeof v==='bigint')return v.toString();if(Array.isArray(v))return v.map(serialize);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,serialize(x)]));return v;}
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){try{await requirePermission('download.edit');const downloadId=Number((await params).id);const b=await req.json();if(!b.version||!b.url)return NextResponse.json({success:false,message:'版本号和下载地址不能为空'},{status:400});const data=await prisma.$transaction(async tx=>{if(b.isLatest)await tx.downloadVersion.updateMany({where:{downloadId},data:{isLatest:false}});return tx.downloadVersion.create({data:{downloadId,version:b.version,sourceType:b.sourceType||'baidu',url:b.url,extractionCode:b.extractionCode||null,fileSize:b.fileSize?BigInt(b.fileSize):null,releaseNotes:b.releaseNotes||null,isLatest:Boolean(b.isLatest)}});});return NextResponse.json({success:true,data:serialize(data)});}catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:'创建版本失败'},{status:400});}}

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requirePermission('download.edit');
    const downloadId=Number((await params).id);
    const b=await req.json();
    const versionId=Number(b.versionId);
    if(!Number.isInteger(downloadId)||downloadId<=0||!Number.isInteger(versionId)||versionId<=0) return NextResponse.json({success:false,message:'下载项或版本 ID 无效'},{status:400});
    if(!String(b.version||'').trim()||!String(b.url||'').trim()) return NextResponse.json({success:false,message:'版本号和下载地址不能为空'},{status:400});
    const existing=await prisma.downloadVersion.findFirst({where:{id:versionId,downloadId},select:{id:true}});
    if(!existing) return NextResponse.json({success:false,message:'没有找到该下载项下的版本'},{status:404});
    const updated=await prisma.$transaction(async tx=>{
      if(Boolean(b.isLatest)) await tx.downloadVersion.updateMany({where:{downloadId,id:{not:versionId}},data:{isLatest:false}});
      return tx.downloadVersion.update({where:{id:versionId},data:{version:String(b.version).trim(),sourceType:String(b.sourceType||'baidu'),url:String(b.url).trim(),extractionCode:String(b.extractionCode||'').trim()||null,releaseNotes:String(b.releaseNotes||'').trim()||null,isLatest:Boolean(b.isLatest)}});
    });
    return NextResponse.json({success:true,data:serialize(updated)});
  }catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:'更新版本失败'},{status:400});}
}
