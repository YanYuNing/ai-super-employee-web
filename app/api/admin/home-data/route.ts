import { NextResponse } from "next/server";
import { checkPermission } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

export async function GET() { const admin = await checkPermission('home.view'); if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403});
  try {
    const page = await prisma.page.findUnique({
      where: {
        slug: "home",
      },
      include: {
        sections: {
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          message: "首页配置不存在",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: page,
    });
  } catch (error) {
    console.error("GET /api/admin/home-data error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "读取首页配置失败",
      },
      {
        status: 500,
      }
    );
  }
}
export async function PUT(request: Request) {
  const admin = await checkPermission('home.edit');
  if (!admin) return NextResponse.json({success:false,message:'没有权限'},{status:403});
  try {
    const body = await request.json();

    const {
      sectionKey,
      title,
      subtitle,
      content,
    } = body;

    if (!sectionKey) {
      return NextResponse.json(
        {
          success: false,
          message: "sectionKey不能为空",
        },
        {
          status: 400,
        }
      );
    }

    const page = await prisma.page.findUnique({
      where: {
        slug: "home",
      },
    });

    if (!page) {
      return NextResponse.json(
        {
          success: false,
          message: "首页配置不存在",
        },
        {
          status: 404,
        }
      );
    }

    const section =
      await prisma.pageSection.upsert({
        where: {
          pageId_sectionKey: {
            pageId: page.id,
            sectionKey,
          },
        },

        update: {
          title: title || null,
          subtitle: subtitle || null,
          content: content || null,
        },

        create: {
          pageId: page.id,
          sectionKey,
          title: title || null,
          subtitle: subtitle || null,
          content: content || null,
          enabled: true,
          sortOrder: 10,
        },
      });

    return NextResponse.json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error(
      "PUT /api/admin/home-data error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "保存首页配置失败",
      },
      {
        status: 500,
      }
    );
  }
}
