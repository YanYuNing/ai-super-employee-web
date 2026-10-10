import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_guard";
export async function GET(){const g=await requireAdmin();if(g)return g;const data=await prisma.lead.findMany({orderBy:{createdAt:"desc"},take:500});return NextResponse.json({success:true,data});}
