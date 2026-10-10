import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(){
 const data=await prisma.homeConfig.findMany({where:{status:true}});
 return NextResponse.json(data);
}
