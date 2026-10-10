import type { Metadata } from 'next';
import './globals.css';
import { prisma } from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  const fallback={title:'豫辉 AI超级员工｜1套AI = 1支营销团队',description:'豫辉 AI超级员工，覆盖AI内容、AI获客、AI引流、AI销售与AI客服，让AI成为企业持续工作的营销团队。'};
  try {
    const s=await prisma.siteSetting.findUnique({where:{id:1}});
    const title=s?.seoTitle||s?.siteName||fallback.title;
    const description=s?.seoDescription||fallback.description;
    const base=process.env.NEXT_PUBLIC_SITE_URL;
    return {metadataBase:base?new URL(base):undefined,title,description,keywords:s?.seoKeywords||undefined,icons:s?.favicon?{icon:s.favicon}:undefined,openGraph:{type:'website',siteName:s?.siteName||'豫辉 AI超级员工',title,description,url:base||undefined,images:s?.logo?[{url:s.logo}]:undefined},twitter:{card:'summary_large_image',title,description,images:s?.logo?[s.logo]:undefined},robots:{index:true,follow:true}};
  } catch { return fallback; }
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
