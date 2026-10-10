import 'dotenv/config';
import { prisma } from '../lib/prisma';

const products = [
  ["ai-video","AI短视频","AI短视频","Sora / Seedance / Veo 驱动的 AI 视频生产与多平台发布。","支持文生视频、图生视频、首尾帧、批量生成，并支持抖音、快手、视频号、小红书、B站等平台发布。","🎬",1],
  ["ai-mix","AI混剪2.0","AI混剪","从文案到画面匹配、剪辑、配音、音乐和模板的一体化混剪。","AI自动理解文案并匹配素材，完成剪辑、配音、音乐与模板组合。","✂️",2],
  ["ai-image","AI生图","AI生图","一句话生成图片，并支持参考图编辑与扩图。","支持 Image2、一句话生图、参考图编辑、扩图等能力。","🖼️",3],
  ["ip-agent","IP智能体","IP智能体","围绕企业与个人IP进行内容策划、数字人、克隆声音和视频生产。","支持多种文案引擎、数字人、克隆声音、字幕、标题及素材匹配。","👤",4],
  ["geo","GEO获客","GEO获客","面向 AI 推荐场景的内容曝光与获客。","结合 DeepSeek、豆包等 AI 推荐场景，自动生成软文并进行媒体分发。","🌐",5],
  ["ai-lead","AI引流","AI引流","覆盖多种曝光、评论、私信与线索筛选场景。","支持多场景曝光、评论与私信互动、线索筛选等能力。","📈",6],
  ["douyin-customer-service","抖音客服","抖音客服","7×24 小时自动接待、识别高意向客户并提醒人工跟进。","支持自动接待、线索获取、私信处理、高意向识别、人工跟进提醒等。","🎵",7],
  ["wechat-customer-service","微信客服","微信客服","7×24 小时自动接待与线索转化。","支持微信场景下的自动接待、客户沟通、线索识别与转化辅助。","💬",8],
  ["wecom-customer-service","企业微信客服","企业微信客服","企业微信自动接待、客户管理与销售跟进辅助。","支持自动接待、好友请求、沉睡客户激活、聊天监控、高意向识别和人工跟进提醒。","🏢",9],
] as const;

async function main() {
  for (const [slug,name,shortName,description,content,icon,sortOrder] of products) {
    await prisma.product.upsert({
      where: { slug },
      update: { name, shortName, description, content, icon, sortOrder, status: "ACTIVE" },
      create: { slug, name, shortName, description, content, icon, sortOrder, status: "ACTIVE" },
    });
  }
  console.log(`已写入 ${products.length} 个产品。`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
