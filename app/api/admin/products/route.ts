import { NextResponse } from "next/server";
import { checkPermission } from '@/lib/admin-auth';
import { prisma } from "@/lib/prisma";

export async function GET() { const admin = await checkPermission('product.view'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403});
  try {
    const products = await prisma.product.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        features: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("读取产品失败:", error);

    return NextResponse.json(
      {
        success: false,
        message: "读取产品失败",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) { const admin = await checkPermission('product.create'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403});
  try {
    const body = await request.json();

    if ((body.status || "ACTIVE") === "ACTIVE") {
      const publisher = await checkPermission("product.publish");
      if (!publisher) return NextResponse.json({ success: false, message: "没有产品发布权限" }, { status: 403 });
    }

    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          success: false,
          message: "产品名称和 slug 为必填项",
        },
        { status: 400 }
      );
    }

    const features = Array.isArray(body.features) ? body.features.map((item: any, index: number) => ({
      name: String(item?.name || '').trim(),
      description: item?.description ? String(item.description).trim() : null,
      icon: item?.icon ? String(item.icon).trim() : null,
      sortOrder: Number(item?.sortOrder ?? index),
    })).filter((item: any) => item.name) : [];

    const product = await prisma.product.create({
      data: {
        name: body.name,
        shortName: body.shortName || null,
        slug: body.slug,
        description: body.description || null,
        content: body.content || null,
        icon: body.icon || null,
        coverImage: body.coverImage || null,
        videoUrl: body.videoUrl || null,
        status: body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        sortOrder: Number(body.sortOrder || 0),
        seoTitle: body.seoTitle || null,
        seoDescription: body.seoDescription || null,
        features: features.length ? { create: features } : undefined,
      },
      include: { features: { orderBy: { sortOrder: 'asc' } } },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("创建产品失败:", error);

    return NextResponse.json(
      {
        success: false,
        message: "创建产品失败",
      },
      { status: 500 }
    );
  }
}
