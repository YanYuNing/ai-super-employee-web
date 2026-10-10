import 'dotenv/config';
import { prisma } from '../lib/prisma';

const products = [
  { slug:'ai-video', name:'AI短视频', shortName:'AI短视频', icon:'🎬', sortOrder:1, description:'Sora / Seedance / Veo 驱动的 AI 视频生产与多平台发布。', content:'支持文生视频、图生视频、首尾帧、批量生成，并支持 1080P 输出以及抖音、快手、视频号、小红书、B站等平台发布。', features:[['文生视频','根据文字描述生成视频内容。'],['图生视频','以图片为基础生成动态视频。'],['首尾帧','支持首帧、尾帧控制，辅助形成连续画面。'],['批量生成','支持批量生产视频素材，提高内容产能。'],['1080P输出','支持最高 1080P 视频生产。'],['多平台发布','支持抖音、快手、视频号、小红书、B站等内容平台。']] },
  { slug:'ai-mix', name:'AI混剪2.0', shortName:'AI混剪', icon:'✂️', sortOrder:2, description:'从文案到画面匹配、剪辑、配音、音乐和模板的一体化混剪。', content:'AI 自动理解文案，根据内容匹配视觉素材，并完成剪辑、配音、音乐与模板组合。', features:[['文案理解','读取并理解营销文案，提取内容结构。'],['智能匹配画面','根据文案内容匹配适合的视觉素材。'],['自动剪辑','自动完成镜头组合与节奏处理。'],['智能配音','为内容配置语音表达。'],['BGM与模板','结合背景音乐和模板快速形成成片。']] },
  { slug:'ai-image', name:'AI生图', shortName:'AI生图', icon:'🖼️', sortOrder:3, description:'一句话生成营销图片，并支持参考图编辑与扩图。', content:'支持 Image2、一句话生图、参考图编辑和扩图等视觉内容生产能力。', features:[['一句话生图','用自然语言快速生成营销视觉。'],['参考图编辑','基于参考图片进行内容调整。'],['扩图','扩展原始画面，满足不同版式需要。'],['营销视觉生产','快速生成宣传、内容与社媒视觉素材。']] },
  { slug:'ip-agent', name:'IP智能体', shortName:'IP智能体', icon:'👤', sortOrder:4, description:'围绕企业与个人IP进行内容策划、数字人、克隆声音和视频生产。', content:'支持多种文案引擎、数字人、克隆声音、字幕、标题及素材匹配，帮助持续生产 IP 内容。', features:[['多种文案引擎','围绕 IP 内容进行持续策划与文案生产。'],['数字人','支持数字人内容生产场景。'],['克隆声音','支持声音能力用于内容表达。'],['字幕与标题','辅助生成视频字幕和标题。'],['素材匹配','根据内容匹配所需视觉素材。']] },
  { slug:'geo', name:'GEO获客', shortName:'GEO获客', icon:'🌐', sortOrder:5, description:'面向 AI 推荐场景的内容曝光与获客。', content:'结合 DeepSeek、豆包等 AI 推荐场景，自动生成软文并进行媒体分发，帮助企业扩大 AI 场景下的内容曝光。', features:[['AI推荐场景','面向 AI 推荐与搜索场景组织内容。'],['软文生成','根据业务方向自动生成内容素材。'],['媒体分发','将内容向媒体渠道进行分发。'],['获客内容策略','围绕关键词与业务场景组织曝光内容。']] },
  { slug:'ai-lead', name:'AI引流', shortName:'AI引流', icon:'📈', sortOrder:6, description:'覆盖曝光、评论、私信与线索筛选等多种自动化引流场景。', content:'支持多种曝光场景、评论与私信互动、线索筛选等能力，帮助企业持续获取潜在客户。', features:[['多场景曝光','覆盖多种内容曝光与触达场景。'],['评论互动','围绕目标内容进行评论互动。'],['私信互动','支持私信场景下的自动沟通。'],['线索筛选','根据沟通情况识别和筛选潜在线索。']] },
  { slug:'douyin-customer-service', name:'抖音客服', shortName:'抖音客服', icon:'🎵', sortOrder:7, description:'7×24小时自动接待、识别高意向客户并提醒人工跟进。', content:'支持自动接待、线索获取、私信处理、高意向识别、人工跟进提醒等抖音客服场景。', features:[['7×24小时接待','持续自动接待用户咨询。'],['线索获取','在沟通过程中获取潜在客户信息。'],['私信处理','辅助处理抖音私信场景。'],['高意向识别','识别具有购买意向的客户。'],['人工跟进提醒','高意向线索及时提醒人工介入。']] },
  { slug:'wechat-customer-service', name:'微信客服', shortName:'微信客服', icon:'💬', sortOrder:8, description:'7×24小时自动接待与线索转化辅助。', content:'支持微信场景下的自动接待、客户沟通、线索识别与转化辅助。', features:[['自动接待','持续处理微信咨询。'],['客户沟通','围绕用户问题进行自动化沟通。'],['线索识别','识别潜在客户与需求。'],['转化辅助','将高意向客户交给人工销售继续跟进。']] },
  { slug:'wecom-customer-service', name:'企业微信客服', shortName:'企业微信客服', icon:'🏢', sortOrder:9, description:'企业微信自动接待、客户管理与销售跟进辅助。', content:'支持自动接待、好友请求、沉睡客户激活、聊天监控、高意向识别和人工跟进提醒等场景。', features:[['自动接待','自动处理企业微信客户咨询。'],['好友请求','辅助处理客户添加与连接。'],['沉睡客户激活','对沉睡客户进行再触达。'],['聊天监控','辅助监控客户沟通状态。'],['高意向识别','识别高意向客户。'],['人工跟进提醒','提醒销售人员及时跟进。']] },
];

const solutions = [
  ['ecommerce','电商行业AI营销方案','围绕内容生产、AI获客、引流与客服，构建持续工作的营销链路。','电商'],
  ['local-life','本地生活AI营销方案','覆盖短视频内容、曝光、私信互动与客户接待等场景。','本地生活'],
  ['education','教育行业AI营销方案','通过内容生产、IP打造、AI获客与客户接待形成营销闭环。','教育'],
  ['auto-service','汽车服务AI营销方案','结合短视频、内容曝光、线索筛选和客服能力提升营销效率。','汽车服务'],
  ['manufacturing','制造业AI营销方案','面向制造企业构建内容生产、GEO获客、线索获取与客户运营体系。','制造业'],
  ['factory','工厂AI营销方案','帮助工厂持续生产内容并通过 AI 场景获取潜在客户。','工厂'],
  ['building-materials','建材行业AI营销方案','围绕产品内容、行业曝光、线索获取与客户沟通形成自动化链路。','建材'],
];

const resourceCategories = [
  ['product-download','产品下载','AI超级员工相关客户端、Skill与产品文件'],
  ['skills','Skills','AI员工与自动化能力的可复用 Skill'],
  ['prompts','Prompt','营销、内容、客服等场景 Prompt'],
  ['manual','使用手册','AI超级员工产品与功能使用资料'],
  ['tutorial','教程','从入门到实际使用的操作教程'],
  ['ai-tools','AI工具','AI营销相关工具与使用资料'],
  ['templates','模板','营销内容、Prompt及业务模板'],
  ['industry-materials','行业资料','行业营销与AI应用资料'],
  ['changelog','更新日志','产品版本和功能更新记录'],
] as const;

const tutorialCategories = [
  ['getting-started','快速入门','AI超级员工基础使用与上手'],
  ['ai-claw','AI Claw','AI Claw 指令、任务拆解与自动执行'],
  ['content-production','内容生产','AI短视频、AI混剪、AI生图和IP内容生产'],
  ['customer-service','AI客服','抖音、微信、企业微信客服场景'],
] as const;

const promptCategories = [
  ['marketing','营销策划','企业营销与获客场景 Prompt'],
  ['short-video','短视频','短视频脚本、标题与内容生产 Prompt'],
  ['ip-content','IP内容','个人与企业IP内容生产 Prompt'],
  ['customer-service','客服销售','客服接待、需求识别与销售辅助 Prompt'],
] as const;

const resources = [
  ['ai-super-employee-manual','AI超级员工使用手册','系统学习 AI Claw、AI视频、AI生图、IP智能体、GEO获客、AI引流和客服能力。','manual'],
  ['ai-claw-3-0-overview','AI Claw 3.0：从被动执行到主动思考','了解 AI Claw 如何通过一句话理解、拆解、配置并执行营销任务。','manual'],
  ['nine-ai-employees','9大AI超级员工全链路营销','了解9大AI员工如何覆盖内容生产、获客引流、客户接待与销售跟进。','industry-materials'],
  ['ai-super-employee-company-intro','豫辉 AI 超级员工产品资料','了解豫辉 AI 超级员工的产品定位、能力组成与适用场景。','product-download'],
] as const;

const tutorials = [
  ['ai-super-employee-start','AI超级员工快速入门','从AI Claw与9大AI员工开始，了解完整营销工作链路。','getting-started'],
  ['ai-claw-task','AI Claw：如何用一句话下达营销任务','学习如何直接用自然语言描述目标，让 AI Claw 理解、拆解并执行任务。','ai-claw'],
  ['ai-video-content','AI短视频内容生产入门','了解文生视频、图生视频、首尾帧、批量生成和多平台发布能力。','content-production'],
  ['ai-mix-content','AI混剪2.0使用思路','从文案理解、画面匹配到配音、音乐和模板，了解一体化混剪流程。','content-production'],
  ['ai-customer-service','AI客服场景入门','了解抖音、微信和企业微信客服的自动接待与高意向识别场景。','customer-service'],
] as const;

const prompts = [
  ['marketing-plan-basic','基础营销方案生成Prompt','根据行业、产品、目标客户生成营销方案。','请根据我提供的行业、产品、目标客户和营销目标，整理一份可执行的AI营销方案，包含内容生产、获客、引流和客户跟进四个部分。','营销策划'],
  ['short-video-script','短视频脚本Prompt','用于生成短视频脚本结构。','请围绕产品卖点生成一条短视频脚本，包含开头钩子、核心内容、信任建立、行动引导，并保持口语化。','短视频'],
  ['ip-content-plan','IP内容策划Prompt','用于个人或企业IP持续内容策划。','请根据我的行业、人物定位和目标客户，规划一组适合持续发布的IP内容选题，并为每个选题给出核心观点和表达方向。','IP内容'],
  ['customer-intent','客户意向识别Prompt','用于识别客服沟通中的高意向客户。','请根据客户的聊天内容，判断客户当前需求、关注点、购买意向信号以及下一步建议的人工跟进动作。','客服销售'],
] as const;

const articles = [
  ['ai-super-employee-intro','1个AI员工就是1支营销铁军','豫辉 AI 超级员工以9大AI员工覆盖企业内容生产、获客、引流与客户服务。','AI超级员工是一套围绕企业营销全链路构建的AI员工体系。它将AI短视频、AI混剪、AI生图、IP智能体、GEO获客、AI引流以及抖音、微信、企业微信客服能力组织起来，帮助企业建立持续工作的AI营销团队。'],
  ['ai-claw-3-0','AI Claw 3.0：从被动执行到主动思考','AI Claw 3.0 是9大AI员工的智能操作中心。','AI Claw 3.0的核心方式是自然语言指令。用户只需要描述目标，系统可以围绕目标进行理解、拆解、配置并调用对应AI能力，减少复杂操作流程。'],
] as const;

const faqs = [
  ['AI超级员工是什么？','豫辉 AI 超级员工是一套面向企业营销的AI员工体系，通过9大AI员工覆盖内容生产、获客、引流、客户接待与销售辅助。','产品'],
  ['AI Claw是什么？','AI Claw是AI超级员工的智能操作中心，支持用户通过自然语言下达任务，并由AI进行理解、拆解、配置和执行。','AI Claw'],
  ['有哪些AI员工？','目前包括AI短视频、AI混剪2.0、AI生图、IP智能体、GEO获客、AI引流、抖音客服、微信客服、企业微信客服。','产品'],
  ['支持哪些短视频平台？','资料中明确列出的平台包括抖音、快手、视频号、小红书和B站。','AI短视频'],
  ['是否支持私有化部署？','产品资料包含私有部署能力说明；具体部署方案、环境和商务条件应以实际项目沟通为准。','部署'],
] as const;

async function ensureProductFeature(productId:number, name:string, description:string, sortOrder:number) {
  const existing = await prisma.productFeature.findFirst({ where: { productId, name } });
  if (!existing) await prisma.productFeature.create({ data: { productId, name, description, sortOrder } });
}

async function main() {
  console.log('开始执行 Stage 05.1 正式 CMS 内容初始化（只补空数据，不覆盖已有内容）...');

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug:p.slug }, select:{id:true} });
    const product = existing
      ? await prisma.product.findUniqueOrThrow({ where:{id:existing.id} })
      : await prisma.product.create({ data:{slug:p.slug,name:p.name,shortName:p.shortName,description:p.description,content:p.content,icon:p.icon,sortOrder:p.sortOrder,status:'ACTIVE'} });
    for (const [index, feature] of p.features.entries()) await ensureProductFeature(product.id, feature[0], feature[1], index + 1);
  }

  const home = await prisma.page.upsert({ where:{slug:'home'}, update:{}, create:{slug:'home',title:'豫辉 AI 超级员工',description:'1个AI员工就是1支营销铁军',status:'PUBLISHED',sortOrder:0,seoTitle:'豫辉 AI 超级员工｜AI获客 + AI引流 + AI销售',seoDescription:'1个AI员工就是1支营销铁军，覆盖企业内容生产、获客、引流与客户服务。',seoKeywords:'豫辉AI超级员工,AI获客,AI引流,AI销售'} });
  const homeSections = [
    ['hero','1个AI员工，就是1支营销铁军','AI获客 + AI引流 + AI销售，让企业拥有一支7×24小时持续工作的AI营销团队。',10],
    ['value','不是一个AI工具，而是一支完整的AI营销团队','从内容生产、品牌IP、AI获客，到客户接待与销售跟进，将多个AI能力组织成完整营销链路。',20],
    ['ai-employees','9大AI超级员工','覆盖内容生产、获客、引流、客户接待与销售辅助。',30],
    ['ai-claw','AI Claw 3.0','从被动执行到主动思考，一句话下达任务，AI负责理解、拆解、配置并推动执行。',40],
    ['solutions','行业解决方案','根据企业业务场景组合9大AI员工能力。',50],
    ['cases','客户案例','真实案例由后台案例库维护，发布后自动同步到官网。',60],
    ['resources','资源中心','Skills、Prompt、教程、工具与产品资料统一沉淀。',70],
    ['cta','让AI成为你的营销团队','立即了解豫辉 AI 超级员工。',80],
  ] as const;
  for (const [sectionKey,title,subtitle,sortOrder] of homeSections) {
    await prisma.pageSection.upsert({ where:{pageId_sectionKey:{pageId:home.id,sectionKey}}, update:{}, create:{pageId:home.id,sectionKey,title,subtitle,sortOrder,enabled:true} });
  }

  const claw = await prisma.page.upsert({ where:{slug:'ai-claw'}, update:{}, create:{slug:'ai-claw',title:'AI Claw 3.0',description:'从被动执行到主动思考的 AI 营销指挥中心。',status:'PUBLISHED',sortOrder:10,seoTitle:'AI Claw 3.0｜豫辉 AI 超级员工',seoDescription:'一句话下达任务，AI Claw理解、拆解、配置并推动执行。'} });
  const clawSections = [
    ['hero','从“被动执行”到“主动思考”','一句话告诉AI目标，AI Claw负责理解、拆解、配置并推动执行。',10],
    ['process','一句话下达任务，AI自己完成后面的工作','AI理解目标后，自动调用对应能力，不需要记复杂操作流程。',20],
    ['examples','支持自然语言下达营销任务','例如：创建关键词曝光任务、生成IP智能体视频、发布短视频。',30],
  ] as const;
  for (const [sectionKey,title,subtitle,sortOrder] of clawSections) {
    await prisma.pageSection.upsert({ where:{pageId_sectionKey:{pageId:claw.id,sectionKey}}, update:{}, create:{pageId:claw.id,sectionKey,title,subtitle,sortOrder,enabled:true} });
  }

  for (const [slug,name,description,industry] of solutions) {
    await prisma.solution.upsert({ where:{slug}, update:{}, create:{slug,name,description,content:`${name}：${description}\n\n适用行业：${industry}。可结合9大AI员工能力，根据企业实际业务场景组合内容生产、获客、引流与客户服务流程。`,tags:[industry],status:'PUBLISHED',sortOrder:solutions.findIndex(x=>x[0]===slug)+1} });
  }

  const categoryMap = new Map<string,number>();
  for (const [slug,name,description] of resourceCategories) {
    const c = await prisma.resourceCategory.upsert({ where:{slug}, update:{name,description,status:'PUBLISHED'}, create:{slug,name,description,status:'PUBLISHED',sortOrder:resourceCategories.findIndex(x=>x[0]===slug)+1} });
    categoryMap.set(slug,c.id);
  }
  for (const [slug,title,description,cat] of resources) {
    await prisma.resource.upsert({ where:{slug}, update:{}, create:{slug,title,description,content:description,categoryId:categoryMap.get(cat),status:'PUBLISHED',sortOrder:resources.findIndex(x=>x[0]===slug)+1,tags:[cat]} });
  }

  const tutorialMap = new Map<string,number>();
  for (const [slug,name,description] of tutorialCategories) {
    const c = await prisma.tutorialCategory.upsert({ where:{slug}, update:{name,description,status:'PUBLISHED'}, create:{slug,name,description,status:'PUBLISHED',sortOrder:tutorialCategories.findIndex(x=>x[0]===slug)+1} });
    tutorialMap.set(slug,c.id);
  }
  for (const [slug,title,description,cat] of tutorials) {
    await prisma.tutorial.upsert({ where:{slug}, update:{}, create:{slug,title,description,content:`${description}\n\n本教程内容以豫辉 AI 超级员工现有产品资料为基础，具体界面和功能以当前版本为准。`,categoryId:tutorialMap.get(cat),status:'PUBLISHED',sortOrder:tutorials.findIndex(x=>x[0]===slug)+1} });
  }

  const promptMap = new Map<string,number>();
  for (const [slug,name,description] of promptCategories) {
    const c = await prisma.promptCategory.upsert({ where:{slug}, update:{name,description,status:'PUBLISHED'}, create:{slug,name,description,status:'PUBLISHED',sortOrder:promptCategories.findIndex(x=>x[0]===slug)+1} });
    promptMap.set(slug,c.id);
  }
  const promptCatByName = new Map(promptCategories.map(([slug,name])=>[name,slug]));
  for (const [slug,title,description,content,catName] of prompts) {
    await prisma.prompt.upsert({ where:{slug}, update:{}, create:{slug,title,description,content,categoryId:promptMap.get(promptCatByName.get(catName) || ''),status:'PUBLISHED',tags:[catName]} });
  }

  for (const [slug,title,summary,content] of articles) {
    await prisma.article.upsert({ where:{slug}, update:{}, create:{slug,title,summary,content,author:'豫辉 AI 超级员工',status:'PUBLISHED',publishedAt:new Date(),tags:['AI超级员工','AI营销']} });
  }

  for (const [question,answer,category] of faqs) {
    const existing = await prisma.faq.findFirst({where:{question}});
    if (!existing) await prisma.faq.create({data:{question,answer,category,status:'PUBLISHED',sortOrder:faqs.findIndex(x=>x[0]===question)+1}});
  }

  const download = await prisma.download.findFirst({ where:{name:'AI超级员工客户端'} });
  if (!download) {
    await prisma.download.create({ data:{name:'AI超级员工客户端',type:'CLIENT',platform:'WINDOWS',description:'豫辉 AI 超级员工客户端下载入口。',status:'ACTIVE',sortOrder:1,versions:{create:{version:'1.0.0',sourceType:'baidu',url:'https://pan.baidu.com/s/1kmEumAbjj-miuQqXKQvW8A?pwd=weqf',extractionCode:'weqf',isLatest:true,releaseNotes:'首版产品下载入口。'}}} });
  }

  const changelog = await prisma.changelog.findFirst({ where:{version:'Stage 05.1'} });
  if (!changelog) {
    await prisma.changelog.create({ data:{version:'Stage 05.1',title:'官网正式 CMS 内容初始化',content:'补充9大AI超级员工、首页CMS区块、AI Claw、行业解决方案、资源、教程、Prompt、FAQ、下载与SEO基础数据。',releaseDate:new Date(),status:'PUBLISHED'} });
  }

  await prisma.siteSetting.upsert({ where:{id:1}, update:{siteName:'豫辉 AI 超级员工',seoTitle:'豫辉 AI 超级员工｜AI获客 + AI引流 + AI销售',seoDescription:'豫辉 AI 超级员工，以9大AI员工覆盖内容生产、获客、引流、客户接待与销售辅助，打造7×24小时持续工作的AI营销团队。',seoKeywords:'豫辉AI超级员工,AI获客,AI引流,AI销售,AI Claw,AI短视频,AI客服'}, create:{id:1,siteName:'豫辉 AI 超级员工',seoTitle:'豫辉 AI 超级员工｜AI获客 + AI引流 + AI销售',seoDescription:'豫辉 AI 超级员工，以9大AI员工覆盖内容生产、获客、引流、客户接待与销售辅助，打造7×24小时持续工作的AI营销团队。',seoKeywords:'豫辉AI超级员工,AI获客,AI引流,AI销售,AI Claw,AI短视频,AI客服'} });

  console.log('Stage 05.1 内容初始化完成。');
  console.log(`产品: ${products.length}；解决方案: ${solutions.length}；资源: ${resources.length}；教程: ${tutorials.length}；Prompt: ${prompts.length}；文章: ${articles.length}；FAQ: ${faqs.length}`);
}

main().catch((error)=>{ console.error(error); process.exit(1); }).finally(()=>prisma.$disconnect());
