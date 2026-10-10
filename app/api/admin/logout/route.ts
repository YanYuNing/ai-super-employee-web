import { NextResponse } from 'next/server';
import { COOKIE, LEGACY_COOKIE } from '@/lib/admin-auth';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set(LEGACY_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
