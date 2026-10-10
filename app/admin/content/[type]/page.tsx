import { redirect } from 'next/navigation';

const SUPPORTED = new Set(['solutions','cases','resources','tutorials','articles','faqs','changelogs','leads']);

export default async function LegacyContentAdmin({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (SUPPORTED.has(type)) redirect(`/admin/cms/${type}`);
  redirect('/admin');
}
