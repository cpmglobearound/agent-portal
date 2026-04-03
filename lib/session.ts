import { cookies } from 'next/headers'
export interface Session { customerId: string; name: string; email: string; role: string; exp: number }
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('portal_session')
  if (!cookie) return null
  try {
    const session = JSON.parse(Buffer.from(cookie.value, 'base64').toString()) as Session
    if (session.exp <= Date.now()) return null
    return session
  } catch { return null }
}
