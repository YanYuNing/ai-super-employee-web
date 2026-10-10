import { getPage, jsonObject } from '@/lib/public-site';
export { getPage };

export type PublicPage = Awaited<ReturnType<typeof getPage>>;

export function getPageSection(page: PublicPage, key: string) {
  return page?.sections?.find((section) => section.sectionKey === key && section.enabled !== false) ?? null;
}

export function getPageData(page: PublicPage, key: string): Record<string, any> {
  const section = getPageSection(page, key);
  return jsonObject(section?.data);
}

export function getPageText(page: PublicPage, key: string, fallback: string) {
  const value = getPageData(page, key).text;
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function getPageList(page: PublicPage, key: string, fallback: any[] = []) {
  const value = getPageData(page, key).items;
  return Array.isArray(value) ? value : fallback;
}

export function getPageValue<T>(page: PublicPage, sectionKey: string, field: string, fallback: T): T {
  const value = getPageData(page, sectionKey)[field];
  return (value === undefined || value === null || value === '') ? fallback : value as T;
}

export function pageStatusLabel(status: string) {
  return ({ DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' } as Record<string, string>)[status] || status;
}
