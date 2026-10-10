/** 官网“9大AI超级员工”的唯一口径。后台产品表允许继续存在其他产品，但官网 AI 员工区只展示这 9 个。 */
export const CORE_AI_EMPLOYEE_SLUGS = [
  'ai-video',
  'ai-mix',
  'ai-image',
  'ip-agent',
  'geo',
  'ai-lead',
  'douyin-customer-service',
  'wechat-customer-service',
  'wecom-customer-service',
] as const;

export const CORE_AI_EMPLOYEE_NAMES = new Set([
  'AI短视频',
  'AI混剪2.0',
  'AI生图',
  'IP智能体',
  'GEO获客',
  'AI引流',
  '抖音客服',
  '微信客服',
  '企业微信客服',
]);

/** 明确排除历史/非9大AI员工产品，避免旧数据误归类。 */
export const NON_CORE_EMPLOYEE_NAMES = new Set(['地图获客']);
export const NON_CORE_EMPLOYEE_SLUGS = new Set(['map-lead', 'map-acquisition', 'map-customer-acquisition']);

export type CatalogProduct = { slug?: string | null; name?: string | null };

export function isCoreAiEmployee(product: CatalogProduct) {
  const slug = String(product.slug || '').trim();
  const name = String(product.name || '').trim();
  if (NON_CORE_EMPLOYEE_SLUGS.has(slug) || NON_CORE_EMPLOYEE_NAMES.has(name)) return false;
  return CORE_AI_EMPLOYEE_SLUGS.includes(slug as (typeof CORE_AI_EMPLOYEE_SLUGS)[number]) || CORE_AI_EMPLOYEE_NAMES.has(name);
}

/**
 * 官网统一使用该函数获取9大AI员工。
 * 除了严格白名单外，再按“slug/名称”去重，避免数据库出现重复产品时前台出现第10个卡片。
 */
export function getCoreAiEmployees<T extends CatalogProduct>(items: T[]) {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    if (!isCoreAiEmployee(item)) continue;
    const slug = String(item.slug || '').trim();
    const name = String(item.name || '').trim();
    const key = slug || name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= CORE_AI_EMPLOYEE_SLUGS.length) break;
  }

  return result;
}

export function isAssetUrl(value?: string | null) {
  const text = String(value || '').trim();
  return /^(https?:\/\/|\/|data:image\/|blob:)/i.test(text) || /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(text);
}
