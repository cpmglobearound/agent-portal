import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

async function getSeatableToken(t: string) {
  const r = await fetch('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
    headers: { Authorization: `Token ${t}` }, cache: 'no-store'
  })
  return (await r.json()).access_token
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentId = req.nextUrl.searchParams.get('agent_id')
  if (!agentId) return NextResponse.json({ deploys: [] })

  try {
    const token = await getSeatableToken(process.env.SEATABLE_AGENTS_TOKEN!)
    const rowsRes = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_AGENTS}/rows/?table_name=agents&limit=200&convert_keys=true`,
      { headers: { Authorization: `Token ${token}` }, cache: 'no-store' }
    )
    const { rows } = await rowsRes.json()
    const agent = rows?.find((r: any) => r.id === agentId || r.service_name === agentId || Object.values(r).includes(agentId))

    if (!agent || !agent.deploy_history) return NextResponse.json({ deploys: [] })

    let deploys: any[] = []
    try {
      const raw = agent.deploy_history
      if (raw && typeof raw === 'string') {
        deploys = JSON.parse(raw)
      }
    } catch {}

    // Format for frontend
    const formatted = deploys.map((d: any) => ({
      date: d.date ? new Date(d.date).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : '?',
      status: d.status || 'success',
      changes: d.message || 'Deploy via Portal',
      by: d.by || '',
    }))

    return NextResponse.json({ deploys: formatted })
  } catch (e) {
    console.error('Deploy history error:', e)
    return NextResponse.json({ deploys: [] })
  }
}
