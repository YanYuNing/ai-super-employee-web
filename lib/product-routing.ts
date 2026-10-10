/** Canonical public URLs for product records, including legacy rows with malformed slugs. */
export type ProductRouteInput = { id?: number | string | null; slug?: string | null; name?: string | null };

const LEGACY_PUBLIC_SLUG_BY_NAME: Record<string, string> = {
  '地图获客': 'map-lead',
};

const LEGACY_PRODUCT_NAMES_BY_PUBLIC_SLUG: Record<string, string[]> = {
  'map-lead': ['地图获客'],
};

export function isValidPublicProductSlug(value: unknown): value is string {
  const slug = String(value ?? '').trim();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug) && slug !== '.' && slug !== '..';
}

export function getPublicProductSlug(product: ProductRouteInput): string {
  const current = String(product.slug ?? '').trim();
  if (isValidPublicProductSlug(current)) return current;

  const name = String(product.name ?? '').trim();
  const legacy = LEGACY_PUBLIC_SLUG_BY_NAME[name];
  if (legacy) return legacy;

  const id = Number(product.id);
  if (Number.isFinite(id) && id > 0) return `product-${Math.trunc(id)}`;
  return 'products';
}

export function getLegacyProductNamesForPublicSlug(slug: string): string[] {
  return LEGACY_PRODUCT_NAMES_BY_PUBLIC_SLUG[String(slug ?? '').trim()] || [];
}

export function getLegacyProductIdForPublicSlug(slug: string): number | null {
  const match = String(slug ?? '').match(/^product-(\d+)$/i);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
