import { NextResponse } from 'next/server'; import { prisma } from '@/lib/prisma';
export async function GET(){const data=await prisma.prompt.findMany({where:{status:'PUBLISHED'},orderBy:{updatedAt:'desc'},include:{category:true}});return NextResponse.json({success:true,data});}
