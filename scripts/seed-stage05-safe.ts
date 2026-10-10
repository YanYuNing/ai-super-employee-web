import 'dotenv/config';
import { prisma } from '../lib/prisma';

const products = [
  ['ai-video','AI短视频','AI短视频','Sora / Seedance / Veo 驱动的 AI 视频生产与多平台发布。','🎬',1],
  ['ai-mix','AI混剪2.0','AI混剪','从文案到画面匹配、剪辑、配音、音乐和模板的一体化混剪。','✂️',2],
  ['ai-image','AI生图','AI生图','一句话生成图片，并支持参考图编辑与扩图。','🖼️',3],
  ['ip-agent','IP智能体','IP智能体','围绕企业与个人IP进行内容策划、数字人、克隆声音和视频生产。','👤',4],
  ['geo','GEO获客','GEO获客','面向 AI 推荐场景的内容曝光与获客。','🌐',5],
  ['ai-lead','AI引流','AI引流','覆盖多种曝光、评论、私信与线索筛选场景。','📈',6],
  ['douyin-customer-service','抖音客服','抖音客服','7×24 小时自动接待、识别高意向客户并提醒人工跟进。','🎵',7],
  ['wechat-customer-service','微信客服','微信客服','7×24 小时自动接待与线索转化。','💬',8],
  ['wecom-customer-service','企业微信客服','企业微信客服','企业微信自动接待、客户管理与销售跟进辅助。','🏢',9],
] as const;

async function main(){
  for(const [slug,name,shortName,description,icon,sortOrder] of products){
    const exists=await prisma.product.findUnique({where:{slug},select:{id:true}});
    if(!exists) await prisma.product.create({data:{slug,name,shortName,description,icon,sortOrder,status:'ACTIVE'}});
  }
  const home=await prisma.page.upsert({where:{slug:'home'},update:{},create:{slug:'home',title:'豫辉 AI 超级员工',description:'1个AI员工就是1支营销铁军',status:'PUBLISHED',sortOrder:0}});
  const homeSections=[
    ['hero','1套AI 1支营销团队','AI获客 · AI引流 · AI内容 · AI销售\n让AI员工持续工作，把营销从“人工操作”变成“智能执行”。',10],
    ['value','不是一个AI工具，而是一支完整的AI营销团队','从内容生产、品牌IP、AI获客，到客户接待与销售跟进，将多个AI能力组织成一条完整的营销链路。',15],
    ['ai-employees','9大AI超级员工','一个AI员工对应一个营销岗位，多个AI员工协同工作，形成完整的AI营销团队。',20],
    ['ai-claw','从“被动执行”到“主动思考”','你只需要告诉AI你想要什么。AI Claw负责理解目标、拆解任务、配置能力并推动执行。',30],
    ['solutions','不同行业，拥有不同的AI营销方案','从内容生产到获客与客户运营，根据企业业务场景组合AI能力。',40],
    ['cases','客户案例','真实案例由后台案例库维护，发布后自动同步到首页。',50],
    ['resources','AI资源中心','Skills、Prompt、教程、产品下载与更新日志，统一沉淀在官网资源中心。',60],
    ['cta','让AI成为你的营销团队','立即了解豫辉 AI超级员工。',70],
  ] as const;
  for(const [sectionKey,title,subtitle,sortOrder] of homeSections){
    const exists=await prisma.pageSection.findUnique({where:{pageId_sectionKey:{pageId:home.id,sectionKey}},select:{id:true}});
    if(!exists) await prisma.pageSection.create({data:{pageId:home.id,sectionKey,title,subtitle,sortOrder,enabled:true}});
  }
  const claw=await prisma.page.upsert({where:{slug:'ai-claw'},update:{},create:{slug:'ai-claw',title:'AI Claw 3.0',description:'从被动执行到主动思考的 AI 营销指挥中心。',status:'PUBLISHED',sortOrder:10}});
  const clawSections=[
    ['hero','从“被动执行”到“主动思考”','一句话告诉AI目标，AI Claw负责理解、拆解、配置并推动执行。',10],
    ['process','一句话下达任务，AI自己完成后面的工作','AI理解目标后，自动调用对应能力，不需要记复杂操作流程。',20],
    ['examples','支持自然语言下达营销任务','把日常营销任务直接交给AI Claw。',30],
  ] as const;
  for(const [sectionKey,title,subtitle,sortOrder] of clawSections){
    const exists=await prisma.pageSection.findUnique({where:{pageId_sectionKey:{pageId:claw.id,sectionKey}},select:{id:true}});
    if(!exists) await prisma.pageSection.create({data:{pageId:claw.id,sectionKey,title,subtitle,sortOrder,enabled:true}});
  }
  console.log('Stage 05 safe seed completed. Existing CMS records were not overwritten.');
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
