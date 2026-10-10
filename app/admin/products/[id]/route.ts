import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPermission } from "@/lib/admin-auth";

type Context = { params: Promise<{ id: string }> };

function normalizeFeatures(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value
    .map((item: any, index: number) => ({
      name: String(item?.name || '').trim(),
      description: item?.description ? String(item.description).trim() : null,
      icon: item?.icon ? String(item.icon).trim() : null,
      sortOrder: Number(item?.sortOrder ?? index),
    }))
    .filter((item) => item.name);
}

export async function PUT(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) return NextResponse.json({ success: false, message: "产品ID无效" }, { status: 400 });

    const editor = await checkPermission('product.edit');
    if (!editor) return NextResponse.json({ success: false, message: '没有产品编辑权限' }, { status: 403 });

    const body = await request.json();
    const current = await prisma.product.findUnique({ where: { id: productId } });
    if (!current) return NextResponse.json({ success: false, message: '产品不存在' }, { status: 404 });

    if (body.status === 'ACTIVE' && current.status !== 'ACTIVE') {
      const publisher = await checkPermission('product.publish');
      if (!publisher) return NextResponse.json({ success: false, message: '没有产品发布权限' }, { status: 403 });
    }

    const data: any = {};
    for (const key of ['name', 'shortName', 'slug', 'description', 'content', 'icon', 'coverImage', 'videoUrl', 'status', 'seoTitle', 'seoDescription']) {
      if (body[key] !== undefined) data[key] = body[key] === '' ? null : body[key];
    }
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder || 0);

    const features = normalizeFeatures(body.features);
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data });
      if (features) {
        await tx.productFeature.deleteMany({ where: { productId } });
        if (features.length) await tx.productFeature.createMany({ data: features.map((feature) => ({ ...feature, productId })) });
      }
      return tx.product.findUnique({ where: { id: productId }, include: { features: { orderBy: { sortOrder: 'asc' } } } });
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("PUT /api/admin/products/[id] error:", error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "更新产品失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) return NextResponse.json({ success: false, message: '产品ID无效' }, { status: 400 });
    const admin = await checkPermission('product.delete');
    if (!admin) return NextResponse.json({ success: false, message: '没有产品删除权限' }, { status: 403 });
    await prisma.product.delete({ where: { id: productId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/products/[id] error:', error);
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '删除产品失败' }, { status: 400 });
  }
}
