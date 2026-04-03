import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

async function getSeatableToken(t: string) {
  const r = await fetch('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
    headers: { Authorization: `Token ${t}` }, cache: 'no-store'
  })
  return (await r.json()).access_token
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const token = await getSeatableToken(process.env.SEATABLE_AGENTS_TOKEN!)
    const res = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_AGENTS}/rows/?table_name=agents&limit=200&convert_keys=true`,
      { headers: { Authorization: `Token ${token}` }, cache: 'no-store' }
    )
    const { rows } = await res.json()

    const isAdmin = session.role === 'admin'

    const agents = (rows || [])
      .filter((r: any) => isAdmin || r.customer_id == session.customerId || Object.values(r).includes(session.customerId))
      .map((r: any) => ({
        id: r.id || r['0000'],
        agent_display_name: r.agent_display_name,
        service_name: r.service_name,
        agent_path: r.agent_path,
        config_json: r.config_json || '{}',
        last_deployed_at: r.last_deployed_at,
        customer_id: isAdmin ? r.customer_id : undefined,
        notion_database_id: r.notion_database_id || null,
        monthly_minutes_quota: r.monthly_minutes_quota || null,
        _id: r._id
      }))

    return NextResponse.json({
      agents,
      customer: { name: session.name, email: session.email, role: session.role }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 })
  }
}
