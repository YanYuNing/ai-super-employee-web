import {NextResponse} from 'next/server';
import { checkPermission } from '@/lib/admin-auth';
export async function GET(){ const admin = await checkPermission('content.view'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403});return NextResponse.json({module:'docs',status:'ready',crud:['create','read','update','delete']});}
