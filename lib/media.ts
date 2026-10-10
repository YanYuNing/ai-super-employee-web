/** Pure media helpers shared by server and client components. */
export function isLikelyImageSource(value?: string | null): boolean {
  const source = String(value || '').trim();
  if (!source) return false;
  if (/^data:image\//i.test(source)) return true;
  if (/^(https?:\/\/|\/|blob:)/i.test(source)) return true;
  return /\.(png|jpe?g|webp|gif|svg)(?:[?#].*)?$/i.test(source);
}

export function dynamicEmployeeTitle(title: string | null | undefined, count: number, fallback = 'AI超级员工'): string {
  const safeCount = Math.max(0, count);
  const value = String(title || '').trim();
  if (/^\d+\s*大AI\s*超级员工/.test(value)) {
    return value.replace(/^\d+\s*大/, `${safeCount}大`);
  }
  return value || `${safeCount}大${fallback}`;
}

export function dynamicEmployeeKicker(value: string | null | undefined, count: number): string {
  const safeCount = String(Math.max(0, count)).padStart(2, '0');
  const text = String(value || '').trim();
  if (/^\d{1,3}\s+AI\s+EMPLOYEES$/i.test(text)) {
    return `${safeCount} AI EMPLOYEES`;
  }
  return text || `${safeCount} AI EMPLOYEES`;
}

export function dynamicEmployeePhrase(value: string | null | undefined, count: number): string {
  const text = String(value || '');
  return text.replace(/\d+\s*大AI\s*超级员工/g, `${Math.max(0, count)}大AI超级员工`);
}
