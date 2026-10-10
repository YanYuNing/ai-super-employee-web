import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getPublicProductSlug } from '@/lib/product-routing';
const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const [products,skills,prompts,resources,tutorials,solutions,cases,pages]=await Promise.all([
    prisma.product.findMany({where:{status:'ACTIVE'},select:{id:true,slug:true,name:true,updatedAt:true}}),
    prisma.skill.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.prompt.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.resource.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.tutorial.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.solution.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.caseStudy.findMany({where:{status:'PUBLISHED'},select:{slug:true,updatedAt:true}}),
    prisma.page.findMany({where:{status:'PUBLISHED',slug:{not:'home'}},select:{slug:true,updatedAt:true}}),
  ]);
  const fixed=['/','/products','/ai-claw','/solutions','/resources','/skills','/prompts','/docs','/downloads','/cases','/about','/contact'];
  return [
    ...fixed.map(path=>({url:`${base}${path}`,lastModified:new Date()})),
    ...products.map(x=>({url:`${base}/products/${getPublicProductSlug(x)}`,lastModified:x.updatedAt})),
    ...skills.map(x=>({url:`${base}/skills/${x.slug}`,lastModified:x.updatedAt})),
    ...prompts.map(x=>({url:`${base}/prompts/${x.slug}`,lastModified:x.updatedAt})),
    ...resources.map(x=>({url:`${base}/resources/${x.slug}`,lastModified:x.updatedAt})),
    ...tutorials.map(x=>({url:`${base}/docs/${x.slug}`,lastModified:x.updatedAt})),
    ...solutions.map(x=>({url:`${base}/solutions/${x.slug}`,lastModified:x.updatedAt})),
    ...cases.map(x=>({url:`${base}/cases/${x.slug}`,lastModified:x.updatedAt})),
    ...pages.filter(x=>!['ai-claw','about'].includes(x.slug)).map(x=>({url:`${base}/${x.slug}`,lastModified:x.updatedAt})),
  ];
}
