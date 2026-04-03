import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

async function getSeatableAccess(t: string) {
  const r = await fetch('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
    headers: { Authorization: `Token ${t}` }, cache: 'no-store'
  })
  const data = await r.json()
  return { token: data.access_token, uuid: data.dtable_uuid }
}

function hashPassword(p: string): string {
  return crypto.createHash('sha256').update(p + 'deseo-salt-2026').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { company, name, email, password } = await req.json()
    if (!company || !email || !password) {
      return NextResponse.json({ error: 'Bitte alle Felder ausfüllen' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
    }

    const { token, uuid } = await getSeatableAccess(process.env.SEATABLE_CUSTOMERS_TOKEN!)

    // Check if email already exists
    const rowsRes = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${uuid}/rows/?table_name=customers&limit=200`,
      { headers: { Authorization: `Token ${token}` }, cache: 'no-store' }
    )
    const { rows } = await rowsRes.json()
    const existing = rows?.find((r: any) => Object.values(r).includes(email))
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert' }, { status: 409 })
    }

    // Create customer via rows append API
    const customerId = company.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now().toString(36)
    const hash = hashPassword(password)
    const today = new Date().toISOString().split('T')[0]
    const displayName = name || company

    const appendRes = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${uuid}/rows/`,
      {
        method: 'POST',
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: 'customers',
          rows: [{
            id: customerId,
            name: displayName,
            email: email,
            password_hash: hash,
            created_at: today,
            active: false
          }]
        })
      }
    )
    const appendData = await appendRes.json()
    console.log('Register append result:', JSON.stringify(appendData).substring(0, 200))

    if (!appendData.inserted_row_count) {
      console.error('Register failed:', appendData)
      return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 })
    }

    // Notify admin via n8n webhook
    try {
      await fetch('https://n8n-hetzner.deseoai.com/webhook/portal-new-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          company,
          name: displayName,
          email,
          registered_at: new Date().toISOString()
        })
      })
      console.log('Admin notification sent')
    } catch (e) {
      console.error('Notify webhook failed (non-critical):', e)
    }

    console.log(`NEW REGISTRATION: ${displayName} (${email}) — ${company}`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
