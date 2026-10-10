export function createSession(userId: string) {
  return Buffer.from(JSON.stringify({ userId, createdAt: Date.now() })).toString('base64')
}
export function verifySession(token?: string) {
  if (!token) return null
  try { return JSON.parse(Buffer.from(token, 'base64').toString()) } catch { return null }
}
