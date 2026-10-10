import { prisma } from "@/lib/prisma";

export type SiteNavItem = { label: string; href: string; enabled?: boolean; children?: SiteNavItem[] };
export type SiteContent = {
  nav?: { items?: SiteNavItem[]; brandTitle?: string; brandSubtitle?: string; contactText?: string; demoText?: string };
  footer?: {
    description?: string;
    productTitle?: string;
    resourceTitle?: string;
    contactTitle?: string;
    knowledgeTitle?: string;
    productLinks?: SiteNavItem[];
    resourceLinks?: SiteNavItem[];
    knowledgeLinks?: SiteNavItem[];
    copyright?: string;
    icp?: string;
  };
  home?: Record<string, string>;
};

const FALLBACK: SiteContent = {
  nav: {
    items: [
      { label: "AI超级员工", href: "/products" },
      { label: "AI Claw", href: "/ai-claw" },
      { label: "解决方案", href: "/solutions" },
      { label: "资源中心", href: "/resources" },
      { label: "案例", href: "/cases" },
      { label: "关于我们", href: "/about" },
    ],
    brandTitle: "豫辉",
    brandSubtitle: "AI超级员工",
    contactText: "联系我们",
    demoText: "预约演示",
  },
  footer: {
    description: "AI获客 + AI引流 + AI销售，让企业拥有一支持续工作的AI营销团队。",
    productTitle: "产品",
    resourceTitle: "资源",
    contactTitle: "联系",
    knowledgeTitle: "知识中心",
    productLinks: [
      { label: "AI超级员工", href: "/products" },
      { label: "AI Claw", href: "/ai-claw" },
      { label: "产品下载", href: "/downloads" },
    ],
    resourceLinks: [
      { label: "Skills", href: "/skills" },
      { label: "Prompt", href: "/prompts" },
      { label: "资源中心", href: "/resources" },
      { label: "使用手册", href: "/docs" },
    ],
    knowledgeLinks: [
      { label: "文章 / 新闻", href: "/articles" },
      { label: "FAQ", href: "/faq" },
      { label: "更新日志", href: "/changelog" },
    ],
  },
  home: {
    heroEyebrow: "AI AGENT · AI WORKFORCE · 24/7",
    heroProofEmployees: "AI超级员工",
    heroProofWork: "持续工作",
    heroProofExecution: "主动执行",
    heroFlow1: "从内容生产",
    heroFlow2: "AI获客",
    heroFlow3: "客户接待",
    heroFlow4: "销售跟进",
    valueKicker: "AI WORKFORCE",
    valueNode1: "内容生产",
    valueNode1Desc: "AI短视频 / AI混剪 / AI生图",
    valueNode2: "品牌IP",
    valueNode2Desc: "IP智能体 / 数字人 / 内容",
    valueNode3: "AI获客",
    valueNode3Desc: "GEO / AI引流 / 多场景曝光",
    valueNode4: "客户转化",
    valueNode4Desc: "抖音 / 微信 / 企业微信客服",
    employeesKicker: "09 AI EMPLOYEES",
    employeeFallback: "AI营销能力，由后台产品内容统一维护。",
    clawKicker: "AI CLAW 3.0",
    clawConsoleTitle: "AI CLAW COMMAND CENTER",
    clawOnline: "ONLINE",
    clawCommand: "我是做装修行业的，帮我创建一个关键词曝光任务",
    clawStep1: "理解任务",
    clawStep2: "自动拆解",
    clawStep3: "调用AI能力",
    clawStep4: "持续执行",
  },
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const rows = await prisma.homeConfig.findMany({ where: { status: true } });
    const map: Record<string, unknown> = {};
    for (const row of rows) {
      try { map[row.key] = row.value ? JSON.parse(row.value) : {}; } catch { map[row.key] = row.value || {}; }
    }
    return {
      nav: { ...FALLBACK.nav, ...(map["site.nav"] as object || {}) },
      footer: { ...FALLBACK.footer, ...(map["site.footer"] as object || {}) },
      home: { ...FALLBACK.home, ...(map["site.home"] as object || {}) },
    };
  } catch {
    return FALLBACK;
  }
}

export async function getContentKey<T = unknown>(key: string, fallback: T): Promise<T> {
  try {
    const row = await prisma.homeConfig.findUnique({ where: { key } });
    if (!row?.status || !row.value) return fallback;
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}

export { FALLBACK as SITE_CONTENT_FALLBACK };
