export function productCountTitle(title: string | null | undefined, count: number) {
  const safeCount = Math.max(0, Number(count) || 0);
  const fallback = `${safeCount}大AI超级员工`;
  const text = String(title || '').trim();
  if (!text) return fallback;
  return text.replace(/^\s*\d+\s*大AI超级员工/, fallback);
}

export function employeeKicker(value: string | null | undefined, count: number) {
  const safeCount = Math.max(0, Number(count) || 0);
  const fallback = `${String(safeCount).padStart(2, '0')} AI EMPLOYEES`;
  const text = String(value || '').trim();
  if (!text) return fallback;
  return text.replace(/^\s*\d+\s*AI\s+EMPLOYEES\b/i, fallback);
}


export function replaceEmployeeCountText(value: string | null | undefined, count: number) {
  const safeCount = Math.max(0, Number(count) || 0);
  return String(value || '')
    .replace(/\d+\s*大AI超级员工/g, `${safeCount}大AI超级员工`)
    .replace(/\d+\s*AI\s+EMPLOYEES/gi, `${String(safeCount).padStart(2, '0')} AI EMPLOYEES`);
}
