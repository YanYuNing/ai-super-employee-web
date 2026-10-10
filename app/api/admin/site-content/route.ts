import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/admin-auth";

const keys = ["site.nav", "site.footer", "site.home"] as const;

export async function GET() {
  const admin = await checkPermission("home.view");
  if (!admin) return NextResponse.json({ success: false, message: "没有权限" }, { status: 403 });
  const rows = await prisma.homeConfig.findMany({ where: { key: { in: [...keys] } } });
  const data: Record<string, unknown> = {};
  for (const key of keys) {
    const row = rows.find((x) => x.key === key);
    try { data[key] = row?.value ? JSON.parse(row.value) : {}; } catch { data[key] = {}; }
  }
  return NextResponse.json({ success: true, data });
}

export async function PUT(request: Request) {
  const admin = await checkPermission("home.edit");
  if (!admin) return NextResponse.json({ success: false, message: "没有权限" }, { status: 403 });
  try {
    const body = await request.json();
    const key = String(body?.key || "");
    if (!keys.includes(key as typeof keys[number])) {
      return NextResponse.json({ success: false, message: "不支持的站点内容类型" }, { status: 400 });
    }
    if (!body?.value || typeof body.value !== "object" || Array.isArray(body.value)) {
      return NextResponse.json({ success: false, message: "内容必须是对象" }, { status: 400 });
    }
    const row = await prisma.homeConfig.upsert({
      where: { key },
      update: { value: JSON.stringify(body.value), status: true },
      create: { key, value: JSON.stringify(body.value), status: true },
    });
    return NextResponse.json({ success: true, data: { key: row.key } });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "保存失败" }, { status: 400 });
  }
}
