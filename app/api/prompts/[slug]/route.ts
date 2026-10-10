import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;const item=await prisma.prompt.findFirst({where:{slug,status:'PUBLISHED'},include:{category:true}});if(!item)return NextResponse.json({success:false,message:'Prompt不存在'},{status:404});return NextResponse.json({success:true,data:item});}
