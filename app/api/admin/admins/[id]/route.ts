import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { requirePermission, isSuperAdmin } from '@/lib/admin-auth';

export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requirePermission('admin.edit'); const id=Number((await params).id); const b=await req.json();
    const target=await prisma.admin.findUnique({where:{id},include:{adminRoles:{include:{role:true}}}}); if(!target) return NextResponse.json({success:false,message:'管理员不存在'},{status:404});
    const targetIsSuper=isSuperAdmin(target);
    if(targetIsSuper && !isSuperAdmin(actor)) return NextResponse.json({success:false,message:'只有超级管理员可以修改超级管理员账号'},{status:403});
    if(id===actor.id && b.status==='INACTIVE') return NextResponse.json({success:false,message:'不能禁用当前登录账号'} ,{status:400});
    const data:any={name:b.name?.trim()||null,email:b.email?.trim()||null,status:b.status==='INACTIVE'?'DISABLED':'ACTIVE'};
    if(b.password) data.passwordHash=hashPassword(b.password);
    if(Array.isArray(b.roleIds)){
      const roleIds=b.roleIds.map(Number).filter(Boolean);
      const roles=roleIds.length?await prisma.role.findMany({where:{id:{in:roleIds}}}):[];
      if(roles.length!==roleIds.length)return NextResponse.json({success:false,message:'存在无效角色'},{status:400});
      const superRole=roles.find((r:any)=>r.name==='超级管理员'||String(r.name).toUpperCase()==='SUPER_ADMIN');
      if(superRole&&!isSuperAdmin(actor))return NextResponse.json({success:false,message:'只有超级管理员可以授予超级管理员角色'},{status:403});
      if(id===actor.id && !superRole && isSuperAdmin(actor)) return NextResponse.json({success:false,message:'不能移除当前超级管理员身份'} ,{status:400});
      if(targetIsSuper && !superRole) return NextResponse.json({success:false,message:'不能移除超级管理员的最高权限身份'} ,{status:400});
      b.roleIds=roleIds;
    }
    const updated=await prisma.$transaction(async tx=>{
      await tx.admin.update({where:{id},data});
      if(Array.isArray(b.roleIds)){await tx.adminRole.deleteMany({where:{adminId:id}});if(b.roleIds.length)await tx.adminRole.createMany({data:b.roleIds.map((roleId:number)=>({adminId:id,roleId})),skipDuplicates:true});}
      return tx.admin.findUnique({where:{id},include:{adminRoles:{include:{role:true}}}});
    });
    return NextResponse.json({success:true,data:updated});
  }catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:'更新管理员失败'},{status:400});}
}

export async function DELETE(_req:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const actor=await requirePermission('admin.delete');const id=Number((await params).id);if(id===actor.id)return NextResponse.json({success:false,message:'不能删除当前登录账号'},{status:400});
    const target=await prisma.admin.findUnique({where:{id},include:{adminRoles:{include:{role:true}}}});if(!target)return NextResponse.json({success:false,message:'管理员不存在'},{status:404});
    if(isSuperAdmin(target)&&!isSuperAdmin(actor))return NextResponse.json({success:false,message:'只有超级管理员可以删除超级管理员账号'},{status:403});
    if(isSuperAdmin(target)){const count=await prisma.admin.findMany({where:{status:'ACTIVE'},include:{adminRoles:{include:{role:true}}}});const superCount=count.filter((x:any)=>isSuperAdmin(x)).length; if(superCount<=1)return NextResponse.json({success:false,message:'至少保留一个超级管理员'},{status:400});}
    await prisma.admin.delete({where:{id}});return NextResponse.json({success:true});
  }catch(e){return NextResponse.json({success:false,message:e instanceof Error?e.message:'删除失败'},{status:400});}
}
