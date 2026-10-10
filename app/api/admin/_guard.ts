import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
export async function requireAdmin(){
  const session = await getAdminSession();
  if(!session?.userId) return NextResponse.json({success:false,message:"未登录或登录已过期"},{status:401});
  return null;
}
