import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { requirePermission, isSuperAdmin } from '@/lib/admin-auth';

function serialize(data: any[]) {
  return data.map((x: any) => ({ id:x.id, username:x.username, name:x.name, email:x.email, role:x.role, status:x.status, createdAt:x.createdAt, updatedAt:x.updatedAt, lastLoginAt:x.lastLoginAt, superAdmin:isSuperAdmin(x), roles:(x.adminRoles||[]).map((r:any)=>({id:r.role.id,name:r.role.name})) }));
}

export async function GET() {
  try { await requirePermission('admin.view'); const data = await prisma.admin.findMany({ orderBy:{createdAt:'desc'}, include:{adminRoles:{include:{role:true}}} }); return NextResponse.json({success:true,data:serialize(data)}); }
  catch(e){ return NextResponse.json({success:false,message:e instanceof Error?e.message:'无权限'},{status:403}); }
}

export async function POST(req: Request) {
  try {
    const actor = await requirePermission('admin.create'); const b = await req.json();
    if(!b.username?.trim() || !b.password) return NextResponse.json({success:false,message:'账号和初始密码不能为空'},{status:400});
    const roleIds = Array.isArray(b.roleIds) ? b.roleIds.map(Number).filter(Boolean) : [];
    const roles = roleIds.length ? await prisma.role.findMany({where:{id:{in:roleIds}}}) : [];
    if (roles.length !== roleIds.length) return NextResponse.json({success:false,message:'存在无效角色'},{status:400});
    const superRole = roles.find((r:any)=>r.name==='超级管理员' || String(r.name).toUpperCase()==='SUPER_ADMIN');
    if (superRole && !isSuperAdmin(actor)) return NextResponse.json({success:false,message:'只有超级管理员可以授予超级管理员角色'},{status:403});
    const created = await prisma.admin.create({ data:{username:b.username.trim(),passwordHash:hashPassword(b.password),name:b.name?.trim()||null,email:b.email?.trim()||null,role:'admin',status:b.status==='INACTIVE'?'DISABLED':'ACTIVE',adminRoles:roleIds.length?{create:roleIds.map((roleId:number)=>({role:{connect:{id:roleId}}}))}:undefined}, include:{adminRoles:{include:{role:true}}} });
    return NextResponse.json({success:true,data:serialize([created])[0],actor:actor.id});
  } catch(e){ return NextResponse.json({success:false,message:e instanceof Error?e.message:'创建管理员失败'},{status:400}); }
}
