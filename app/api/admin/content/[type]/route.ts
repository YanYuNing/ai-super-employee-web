import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin-auth";

// Legacy compatibility API. The current admin UI uses /api/admin/cms/*,
// but this endpoint may still be called by older clients, so keep it guarded.
const allowed = {
  solutions: { model: "solution", fields: ["slug", "name", "description", "content", "coverImage", "icon", "tags", "status", "sortOrder", "seoTitle", "seoDescription"] },
  cases: { model: "caseStudy", fields: ["slug", "title", "description", "content", "companyName", "industry", "coverImage", "logo", "results", "tags", "status", "sortOrder", "seoTitle", "seoDescription"] },
  resources: { model: "resource", fields: ["slug", "title", "description", "content", "coverImage", "fileUrl", "videoUrl", "tags", "status", "sortOrder", "seoTitle", "seoDescription", "categoryId"] },
} as const;

type CmsType = keyof typeof allowed;
function getConfig(type: string) {
  return allowed[type as CmsType];
}
function pick(body: any, fields: readonly string[]) {
  const data: any = {};
  for (const field of fields) if (body[field] !== undefined) data[field] = body[field];
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
  if (data.categoryId !== undefined) data.categoryId = data.categoryId ? Number(data.categoryId) : null;
  return data;
}
function denied(error: unknown) {
  return NextResponse.json(
    { success: false, message: error instanceof Error ? error.message : "没有权限" },
    { status: 403 },
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const cfg = getConfig(type);
  if (!cfg) return NextResponse.json({ success: false, message: "不支持的内容类型" }, { status: 404 });
  try {
    await requirePermission("content.view");
    const model: any = (prisma as any)[cfg.model];
    const rows = await model.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    return denied(error);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const cfg = getConfig(type);
  if (!cfg) return NextResponse.json({ success: false, message: "不支持的内容类型" }, { status: 404 });
  try {
    await requirePermission("content.create");
    const body = await req.json();
    if (!body.slug) return NextResponse.json({ success: false, message: "slug不能为空" }, { status: 400 });
    const row = await (prisma as any)[cfg.model].create({ data: pick(body, cfg.fields) });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    return denied(error);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const cfg = getConfig(type);
  if (!cfg) return NextResponse.json({ success: false, message: "不支持的内容类型" }, { status: 404 });
  try {
    await requirePermission("content.edit");
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, message: "id不能为空" }, { status: 400 });
    const row = await (prisma as any)[cfg.model].update({ where: { id: Number(body.id) }, data: pick(body, cfg.fields) });
    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    return denied(error);
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const cfg = getConfig(type);
  if (!cfg) return NextResponse.json({ success: false, message: "不支持的内容类型" }, { status: 404 });
  try {
    await requirePermission("content.delete");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, message: "id不能为空" }, { status: 400 });
    await (prisma as any)[cfg.model].delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return denied(error);
  }
}
