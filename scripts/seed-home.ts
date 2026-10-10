import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  const page = await prisma.page.upsert({
    where: {
      slug: "home",
    },
    update: {},
    create: {
      slug: "home",
      title: "豫辉 AI 超级员工",
      description: "1个AI员工就是1支营销铁军",
      status: "PUBLISHED",
      sortOrder: 0,
    },
  });

  const sections = [
    {
      sectionKey: "hero",
      title: "1个AI员工，就是1支营销铁军",
      subtitle:
        "AI获客 + AI引流 + AI销售，让企业拥有一支7×24小时持续工作的AI营销团队。",
      data: {
        primaryButton: {
          text: "立即体验",
          url: "/contact",
        },
        secondaryButton: {
          text: "了解AI超级员工",
          url: "/products",
        },
        task: {
          status: "EXECUTING",
          agent: "AI Claw 3.0",
          title: "正在执行：装修行业关键词曝光任务",
          mode: "关键词曝光 · 自动执行",
          meta: "自动拆解任务",
          progress: 82,
        },
        floatingStatuses: ["内容生成中", "关键词策略已生成", "正在接待客户"],
      },
      sortOrder: 10,
    },
    {
      sectionKey: "ai-employees",
      title: "9大AI超级员工",
      subtitle: "覆盖企业从内容生产、获客引流到客户转化的完整营销链路",
      data: {},
      sortOrder: 20,
    },
    {
      sectionKey: "ai-claw",
      title: "AI Claw 3.0",
      subtitle: "从被动执行，到主动思考",
      content:
        "一句话下达任务，AI自动理解、拆解、配置并执行，让9大AI超级员工协同工作。",
      data: {
        button: {
          text: "了解 AI Claw",
          url: "/ai-claw",
        },
      },
      sortOrder: 30,
    },
    {
      sectionKey: "solutions",
      title: "覆盖企业营销全链路",
      subtitle: "从内容生产到获客、引流、销售与客户服务",
      sortOrder: 40,
    },
    {
      sectionKey: "cases",
      title: "客户案例",
      subtitle: "用AI重新构建企业营销效率",
      sortOrder: 50,
    },
    {
      sectionKey: "resources",
      title: "资源中心",
      subtitle: "Skills、Prompt、教程、工具与产品资料",
      sortOrder: 60,
    },
    {
      sectionKey: "cta",
      title: "让AI成为你的营销团队",
      subtitle: "立即了解豫辉 AI 超级员工",
      data: {
        button: {
          text: "预约演示",
          url: "/contact",
        },
      },
      sortOrder: 70,
    },
  ];

  for (const section of sections) {
    await prisma.pageSection.upsert({
      where: {
        pageId_sectionKey: {
          pageId: page.id,
          sectionKey: section.sectionKey,
        },
      },
      update: {
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        data: section.data,
        sortOrder: section.sortOrder,
        enabled: true,
      },
      create: {
        pageId: page.id,
        sectionKey: section.sectionKey,
        title: section.title,
        subtitle: section.subtitle,
        content: section.content,
        data: section.data,
        sortOrder: section.sortOrder,
        enabled: true,
      },
    });
  }

  console.log("首页 CMS 数据初始化完成");
  console.log(`Page ID: ${page.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });