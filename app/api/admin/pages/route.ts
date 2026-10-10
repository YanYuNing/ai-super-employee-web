import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/admin-auth";

const defaults=[["home","首页"],["about","关于我们"],["contact","联系我们"],["ai-claw","AI Claw"],["products","产品中心"],["solutions","解决方案"],["cases","案例中心"],["resources","资源中心"],["skills","Skills中心"],["prompts","Prompt中心"],["docs","使用手册"],["downloads","下载中心"],["articles","文章 / 新闻"],["faq","FAQ"],["changelog","更新日志"]] as const;

export async function GET(){
 const admin=await checkPermission("page.view"); if(!admin)return NextResponse.json({success:false,message:"没有权限"},{status:403});
 const pages=await prisma.page.findMany({orderBy:{sortOrder:"asc"},include:{sections:{orderBy:{sortOrder:"asc"}}}});
 const map=new Map(pages.map(p=>[p.slug,p]));
 return NextResponse.json({success:true,data:defaults.map(([slug,title],i)=>map.get(slug)||{id:null,slug,title,description:"",content:"",coverImage:null,status:"PUBLISHED",sortOrder:i,seoTitle:"",seoDescription:"",seoKeywords:"",sections:[]})});
}