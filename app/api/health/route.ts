import {NextResponse} from "next/server";
export function GET(){return NextResponse.json({version:"v6",status:"ok"});}
