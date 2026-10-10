import {prisma} from '../lib/prisma';
async function main(){
 await prisma.prompt.upsert({where:{slug:'default-marketing'},update:{},create:{slug:'default-marketing',title:'营销策划Prompt',content:'生成营销方案',status:'PUBLISHED'}});
 await prisma.download.create({data:{name:'AI超级员工客户端',type:'CLIENT',versions:{create:{version:'1.0.0',url:'https://pan.baidu.com/s/1kmEumAbjj-miuQqXKQvW8A?pwd=weqf',extractionCode:'weqf',sourceType:'baidu',isLatest:true}}}});
}
main().finally(()=>prisma.$disconnect());
