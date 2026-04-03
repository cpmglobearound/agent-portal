import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

async function getSeatableToken(t: string): Promise<string> {
  const r = await fetch('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
    headers: { Authorization: `Token ${t}` }, cache: 'no-store'
  })
  return (await r.json()).access_token
}

function hashPassword(p: string): string {
  return crypto.createHash('sha256').update(p + 'deseo-salt-2026').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Felder fehlen' }, { status: 400 })

    const token = await getSeatableToken(process.env.SEATABLE_CUSTOMERS_TOKEN!)
    const res = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_CUSTOMERS}/rows/?table_name=customers&limit=200`,
      { headers: { Authorization: `Token ${token}` }, cache: 'no-store' }
    )
    const { rows } = await res.json()

    const customer = rows?.find((r: any) => r['abPE']?.toLowerCase() === email.toLowerCase())
    if (!customer) return NextResponse.json({ error: 'E-Mail oder Passwort falsch' }, { status: 401 })

    if (!customer['0Zuv']) {
      return NextResponse.json({ error: 'Ihr Zugang wurde noch nicht freigeschaltet. Wir melden uns bei Ihnen per E-Mail.' }, { status: 403 })
    }

    const storedHash = customer['9Qcf']
    if (!storedHash || hashPassword(password) !== storedHash) {
      return NextResponse.json({ error: 'E-Mail oder Passwort falsch' }, { status: 401 })
    }

    const customerId = customer['0000']
    const name = customer['lHCq'] || 'Kunde'
    // Seatable single-select returns option name or ID
    const rawRole = customer['R2mN'] || 'customer'
    const role = (rawRole === 'admin' || rawRole === '420668') ? 'admin' : 'customer'

    const session = { customerId, name, email, role, exp: Date.now() + 7 * 24 * 60 * 60 * 100 }
    const cookieStore = await cookies()
    cookieStore.set('portal_session', Buffer.from(JSON.stringify(session)).toString('base64'), {
      httpOnly: true, secure: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/'
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
