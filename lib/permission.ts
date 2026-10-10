import { PERMISSION_CATALOG } from '@/lib/rbac/catalog';

export const roles = {
  SUPER_ADMIN: ['*'],
  ADMIN: PERMISSION_CATALOG.map((x) => x.code),
  EDITOR: PERMISSION_CATALOG.filter((x) => /^(dashboard|home|product|skill|prompt|content|download|lead)\./.test(x.code)).map((x) => x.code),
} as const;

export function can(role: string, permission: string) {
  const normalized = String(role || '').trim().toUpperCase();
  if (normalized === 'ADMIN' || normalized === 'SUPER_ADMIN' || normalized === 'SUPERADMIN') return true;
  const list = (roles as any)[normalized] as string[] | undefined;
  return !!list && (list.includes('*') || list.includes(permission) || list.some((p: string) => permission === p || permission.startsWith(`${p}.`)));
}
