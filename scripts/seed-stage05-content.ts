import 'dotenv/config';
import { prisma } from '../lib/prisma';

const products = [
  ['ai-video','AI短视频','AI短视频','Sora / Seedance / Veo 驱动的 AI 视频生产与多平台发布。','支持文生视频、图生视频、首尾帧、批量生成，并支持抖音、快手、视频号、小红书、B站等平台发布。','🎬',1],
  ['ai-mix','AI混剪2.0','AI混剪','从文案到画面匹配、剪辑、配音、音乐和模板的一体化混剪。','AI自动理解文案并匹配素材，完成剪辑、配音、音乐与模板组合。','✂️',2],
  ['ai-image','AI生图','AI生图','一句话生成图片，并支持参考图编辑与扩图。','支持 Image2、一句话生图、参考图编辑、扩图等能力。','🖼️',3],
  ['ip-agent','IP智能体','IP智能体','围绕企业与个人IP进行内容策划、数字人、克隆声音和视频生产。','支持多种文案引擎、数字人、克隆声音、字幕、标题及素材匹配。','👤',4],
  ['geo','GEO获客','GEO获客','面向 AI 推荐场景的内容曝光与获客。','结合 DeepSeek、豆包等 AI 推荐场景，自动生成软文并进行媒体分发。','🌐',5],
  ['ai-lead','AI引流','AI引流','覆盖多种曝光、评论、私信与线索筛选场景。','支持多场景曝光、评论与私信互动、线索筛选等能力。','📈',6],
  ['douyin-customer-service','抖音客服','抖音客服','7×24 小时自动接待、识别高意向客户并提醒人工跟进。','支持自动接待、线索获取、私信处理、高意向识别、人工跟进提醒等。','🎵',7],
  ['wechat-customer-service','微信客服','微信客服','7×24 小时自动接待与线索转化。','支持微信场景下的自动接待、客户沟通、线索识别与转化辅助。','💬',8],
  ['wecom-customer-service','企业微信客服','企业微信客服','企业微信自动接待、客户管理与销售跟进辅助。','支持自动接待、好友请求、沉睡客户激活、聊天监控、高意向识别和人工跟进提醒。','🏢',9],
] as const;

const productFeatures: Record<string, string[]> = {
  'ai-video':['文生视频 / 图生视频','首尾帧与批量生成','多平台内容发布'],
  'ai-mix':['文案理解与画面匹配','自动剪辑、配音、音乐','模板化批量混剪'],
  'ai-image':['一句话生图','参考图编辑','扩图与视觉素材生成'],
  'ip-agent':['多种文案引擎','数字人与克隆声音','字幕、标题与素材匹配'],
  'geo':['AI推荐场景内容曝光','自动生成软文','媒体内容分发'],
  'ai-lead':['多场景自动曝光','评论与私信互动','线索筛选'],
  'douyin-customer-service':['7×24自动接待','高意向识别','人工跟进提醒'],
  'wechat-customer-service':['自动接待','客户沟通与线索识别','转化辅助'],
  'wecom-customer-service':['自动接待与好友请求','沉睡客户激活','聊天监控与高意向识别'],
};

const solutions = [
  ['ecommerce','电商行业AI营销方案','围绕短视频、AI混剪、AI生图、获客引流与客服，组合企业电商营销链路。','电商业务可根据内容生产、曝光获客、客户接待等场景组合AI能力。',['电商','内容营销','客户转化'],1],
  ['local-life','本地生活AI营销方案','覆盖内容生产、曝光、评论私信与客户接待等本地生活营销场景。','从内容生产到线索获取和客户接待，按本地生活业务流程组合AI员工。',['本地生活','获客','客服'],2],
  ['education','教育行业AI营销方案','结合短视频、IP内容、GEO获客与客服能力，形成持续内容与线索运营。','根据教育业务的内容曝光、线索获取和客户沟通场景组合AI能力。',['教育','IP运营','AI获客'],3],
  ['auto-service','汽车服务AI营销方案','围绕内容生产、AI获客、引流与销售前客服接待建立自动化营销链路。','根据汽车服务业务的内容曝光、线索筛选和客户沟通场景组合AI员工。',['汽车服务','线索','客服'],4],
  ['manufacturing','制造业AI营销方案','面向制造企业的内容传播、AI推荐曝光、线索获取与客户沟通场景。','结合制造业业务特点，把内容、GEO、引流和客户服务能力组织起来。',['制造业','GEO','获客'],5],
  ['building-materials','建材行业AI营销方案','面向建材企业的内容生产、行业曝光、线索获取和客户跟进。','根据建材业务的内容、曝光、获客与客户服务环节组合AI员工。',['建材','内容营销','销售'],6],
] as const;

const resourceCategories = [
  ['product-downloads','产品下载','产品客户端、安装包及版本资料',1],
  ['skills','Skills','可复用的AI工作能力',2],
  ['prompts','Prompt','可直接复用的提示词模板',3],
  ['manuals','使用手册','AI超级员工产品使用资料',4],
  ['tutorials','教程','产品操作与使用教程',5],
  ['ai-tools','AI工具','AI营销工具与能力资料',6],
  ['templates','模板','营销内容与执行模板',7],
  ['industry-materials','行业资料','行业营销与AI应用资料',8],
  ['changelog','更新日志','产品版本更新记录',9],
] as const;

const tutorials = [
  ['ai-claw-quickstart','AI Claw 3.0 快速上手','用自然语言向 AI Claw 下达营销任务，理解任务、拆解、调度与执行流程。','从一句话任务开始，逐步理解 AI Claw 如何识别目标、生成执行步骤并调用对应 AI 员工。',['AI Claw','入门'],1],
  ['ai-workforce-overview','9大AI超级员工使用总览','了解9个AI员工分别承担什么营销岗位，以及如何形成完整营销链路。','AI超级员工覆盖AI短视频、AI混剪、AI生图、IP智能体、GEO获客、AI引流以及抖音、微信、企业微信客服。',['AI员工','产品'],2],
  ['ai-video-publishing','AI短视频内容生产与发布','了解AI短视频的生成能力以及多平台发布流程。','支持文生视频、图生视频、首尾帧、批量生成，并支持抖音、快手、视频号、小红书、B站等平台发布。',['AI短视频','发布'],3],
] as const;

const faqs = [
  ['AI超级员工是什么？','豫辉 AI超级员工定位为一套AI获客、AI引流、AI内容、AI销售与AI客服能力组成的AI营销团队。'],
  ['AI Claw 3.0有什么作用？','AI Claw 3.0是统一的智能操作中心，可以根据自然语言理解目标、拆解任务、配置能力并推动执行。'],
  ['有哪些AI超级员工？','目前资料中包括AI短视频、AI混剪2.0、AI生图、IP智能体、GEO获客、AI引流、抖音客服、微信客服、企业微信客服9个AI员工。'],
  ['支持哪些内容平台？','AI短视频资料中列出的发布平台包括抖音、快手、视频号、小红书和B站。'],
  ['可以私有化部署吗？','现有产品资料包含私有化部署方案，并说明可提供升级与技术支持；具体部署条件和商务方案以实际沟通为准。'],
] as const;

const changelog = [
  ['3.0','AI Claw 3.0：从被动执行到主动思考','AI Claw升级为主动思考的AI操作中心，通过自然语言统一调度9大AI超级员工。','2026-09-01'],
  ['2.0','AI混剪2.0能力升级','围绕文案理解、画面匹配、剪辑、配音、音乐和模板形成一体化混剪能力。','2026-08-01'],
] as const;

async function main() {
  // 只补缺失内容，不覆盖已有CMS记录。
  for (const [slug,name,shortName,description,content,icon,sortOrder] of products) {
    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: { slug,name,shortName,description,content,icon,sortOrder,status:'ACTIVE' },
    });
    const features = productFeatures[slug] || [];
    for (let i=0;i<features.length;i++) {
      const feature = await prisma.productFeature.findFirst({ where: { productId: product.id, name: features[i] }, select: { id: true } });
      if (!feature) {
        await prisma.productFeature.create({ data: { productId: product.id, name: features[i], description: features[i], sortOrder: i+1 } });
      }
    }
  }

  for (const [slug,name,description,content,tags,sortOrder] of solutions) {
    await prisma.solution.upsert({ where:{slug}, update:{}, create:{slug,name,description,content,tags,sortOrder,status:'PUBLISHED'} });
  }

  const categoryIds: Record<string,number> = {};
  for (const [slug,name,description,sortOrder] of resourceCategories) {
    // ResourceCategory 同时对 slug 和 name 建立唯一约束。
    // 旧数据库可能已经存在同名但 slug 不同的分类，此时直接 upsert(slug) 会触发 name 唯一约束。
    // 因此先按 slug 查，再按 name 查；已有记录直接复用，不覆盖用户已有内容。
    let c = await prisma.resourceCategory.findUnique({ where: { slug } });
    if (!c) {
      c = await prisma.resourceCategory.findUnique({ where: { name } });
    }
    if (!c) {
      c = await prisma.resourceCategory.create({
        data: { slug, name, description, sortOrder, status: 'PUBLISHED' },
      });
    }
    categoryIds[slug] = c.id;
  }

  const tutorialCategory = await prisma.tutorialCategory.upsert({where:{slug:'product-guides'},update:{},create:{slug:'product-guides',name:'产品教程',description:'AI超级员工产品使用教程',sortOrder:1,status:'PUBLISHED'}});
  for (const [slug,title,description,content,tags,sortOrder] of tutorials) {
    await prisma.tutorial.upsert({where:{slug},update:{},create:{slug,title,description,content,tags,sortOrder,status:'PUBLISHED',categoryId:tutorialCategory.id}});
  }

  const resources = [
    ['ai-super-employee-manual','AI超级员工使用手册','完整产品使用手册与功能说明。','AI超级员工使用手册涵盖AI Claw、AI短视频、AI混剪、AI生图、IP智能体、GEO、AI引流和客服等模块。','manuals',1],
    ['ai-super-employee-overview','9大AI超级员工全链路营销资料','了解9大AI员工如何组成完整营销链路。','用于官网资源中心展示的产品总览资料。','product-downloads',2],
  ] as const;
  for (const [slug,title,description,content,cat,sortOrder] of resources) {
    await prisma.resource.upsert({where:{slug},update:{},create:{slug,title,description,content,categoryId:categoryIds[cat],sortOrder,status:'PUBLISHED'}});
  }

  for (const [question,answer] of faqs) {
    const existing = await prisma.faq.findFirst({where:{question}});
    if (!existing) await prisma.faq.create({data:{question,answer,status:'PUBLISHED'}});
  }

  for (const [version,title,content,releaseDate] of changelog) {
    const existing = await prisma.changelog.findFirst({where:{version,title}});
    if (!existing) await prisma.changelog.create({data:{version,title,content,releaseDate:new Date(releaseDate),status:'PUBLISHED'}});
  }

  await prisma.siteSetting.upsert({
    where:{id:1},
    update:{},
    create:{
      id:1,
      siteName:'豫辉 AI超级员工',
      seoTitle:'豫辉 AI超级员工｜1套AI = 1支营销团队',
      seoDescription:'豫辉 AI超级员工覆盖AI内容、AI获客、AI引流、AI销售与AI客服，让AI成为企业持续工作的营销团队。',
      seoKeywords:'豫辉AI超级员工,AI超级员工,AI获客,AI引流,AI销售,AI客服,AI Claw',
      copyright:'© 豫辉 AI超级员工',
    }
  });

  const home = await prisma.page.upsert({where:{slug:'home'},update:{},create:{slug:'home',title:'豫辉 AI超级员工',description:'1个AI员工就是1支营销铁军',status:'PUBLISHED',sortOrder:0}});
  const homeSections = [
    ['hero','1套AI 1支营销团队','AI获客 · AI引流 · AI内容 · AI销售\n让AI员工持续工作，把营销从“人工操作”变成“智能执行”。',10,{primaryButton:{text:'探索AI超级员工',url:'/products'},secondaryButton:{text:'了解 AI Claw',url:'/ai-claw'}}],
    ['value','不是一个AI工具，而是一支完整的AI营销团队','从内容生产、品牌IP、AI获客，到客户接待与销售跟进，将多个AI能力组织成一条完整的营销链路。',15,{}],
    ['ai-employees','9大AI超级员工','一个AI员工对应一个营销岗位，多个AI员工协同工作，形成完整的AI营销团队。',20,{}],
    ['ai-claw','从“被动执行”到“主动思考”','你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。',30,{button:{text:'了解 AI Claw',url:'/ai-claw'}}],
    ['solutions','不同行业，拥有不同的AI营销方案','从内容生产到获客与客户运营，根据企业业务场景组合AI能力。',40,{}],
    ['cases','客户案例','真实客户案例由后台案例库发布后展示。',50,{}],
    ['resources','AI资源中心','Skills、Prompt、教程、产品下载与更新日志，统一沉淀在官网资源中心。',60,{}],
    ['cta','让AI成为你的营销团队','立即了解豫辉 AI超级员工。',70,{button:{text:'预约演示',url:'/contact'}}],
  ] as const;
  for (const [sectionKey,title,subtitle,sortOrder,data] of homeSections) {
    await prisma.pageSection.upsert({where:{pageId_sectionKey:{pageId:home.id,sectionKey}},update:{},create:{pageId:home.id,sectionKey,title,subtitle,sortOrder,enabled:true,data}});
  }

  const claw = await prisma.page.upsert({where:{slug:'ai-claw'},update:{},create:{slug:'ai-claw',title:'AI Claw 3.0',description:'从被动执行到主动思考的AI营销指挥中心。',status:'PUBLISHED',sortOrder:10,seoTitle:'AI Claw 3.0｜主动思考的AI营销指挥中心',seoDescription:'AI Claw 3.0统一调度9大AI超级员工，一句话理解目标、拆解任务、配置能力并推动执行。'}});
  const clawSections = [
    ['hero','从“被动执行”到“主动思考”','一句话告诉AI目标，AI Claw负责理解、拆解、配置并推动执行。',10,{command:'我是做装修行业的，帮我创建一个关键词曝光任务'}],
    ['process','一句话下达任务，AI自己完成后面的工作','AI理解目标后，自动调用对应能力，不需要记复杂操作流程。',20,{items:[{number:'01',title:'理解任务',desc:'识别行业、目标与任务要求'},{number:'02',title:'自动拆解',desc:'生成执行步骤与策略'},{number:'03',title:'调用AI能力',desc:'调度对应AI超级员工协同工作'},{number:'04',title:'持续执行',desc:'任务创建后持续推进并反馈'}]}],
    ['examples','支持自然语言下达营销任务','把日常营销任务直接交给AI Claw。',30,{items:[{text:'我是做装修行业的，帮我创建一个关键词曝光任务'},{text:'帮我生成一条 IP 智能体视频'},{text:'帮我发布一下短视频'}]}],
    ['capabilities','9大AI超级员工统一协同','AI Claw负责把目标拆解为可执行任务。',40,{items:[{title:'理解',desc:'识别行业、目标与任务上下文。'},{title:'拆解',desc:'把自然语言转换成清晰的执行步骤。'},{title:'调度',desc:'调用内容、获客、引流、客服等AI员工。'},{title:'执行',desc:'持续推动任务并反馈执行结果。'}]}],
  ] as const;
  for (const [sectionKey,title,subtitle,sortOrder,data] of clawSections) {
    await prisma.pageSection.upsert({where:{pageId_sectionKey:{pageId:claw.id,sectionKey}},update:{},create:{pageId:claw.id,sectionKey,title,subtitle,sortOrder,enabled:true,data}});
  }

  console.log('阶段05.2正式内容初始化完成：只补缺失记录，不覆盖已有CMS内容。');
}

main().catch((e)=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
