import { NextResponse } from 'next/server'; import { prisma } from '@/lib/prisma';
function serialize(v:unknown):unknown{if(typeof v==='bigint')return v.toString();if(Array.isArray(v))return v.map(serialize);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,serialize(x)]));return v;}
export async function GET(){const data=await prisma.skill.findMany({where:{status:'PUBLISHED'},orderBy:[{sortOrder:'asc'},{updatedAt:'desc'}],include:{versions:{where:{isLatest:true},take:1}}});return NextResponse.json({success:true,data:serialize(data)});}
