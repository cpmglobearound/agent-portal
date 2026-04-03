import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

async function getSeatableToken(t: string) {
  const r = await fetch('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
    headers: { Authorization: `Token ${t}` }, cache: 'no-store'
  })
  return (await r.json()).access_token
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { agent_id, config } = await req.json()
    const token = await getSeatableToken(process.env.SEATABLE_AGENTS_TOKEN!)

    // Fetch agent rows with convert_keys
    const rowsRes = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_AGENTS}/rows/?table_name=agents&limit=200&convert_keys=true`,
      { headers: { Authorization: `Token ${token}` }, cache: 'no-store' }
    )
    const { rows } = await rowsRes.json()
    const agent = rows?.find((r: any) => r.id === agent_id || r.service_name === agent_id || Object.values(r).includes(agent_id))
    if (!agent) return NextResponse.json({ error: 'Agent nicht gefunden' }, { status: 404 })

    const agentPath = agent.agent_path || ''
    const rowId = agent._id

    console.log('Deploy:', { agent_id, agentPath, rowId })

    // Update config in Seatable
    const configStr = JSON.stringify(config)
    const sql = `UPDATE agents SET config_json='${configStr}' WHERE _id='${rowId}'`
    const sqlRes = await fetch(
      `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_AGENTS}/sql/`,
      {
        method: 'POST',
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql })
      }
    )
    const sqlData = await sqlRes.json()
    console.log('Seatable SQL update:', sqlData.success ? 'OK' : sqlData.error_message)

    // Deploy via n8n
    const deployRes = await fetch(process.env.N8N_DEPLOY_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id,
        deployed_by: session.email,
        config_json: JSON.stringify(config),
        agent_path: agentPath
      })
    })
    const deployData = await deployRes.json()
    console.log('n8n response:', JSON.stringify(deployData))

    const deploySuccess = deployRes.ok

    // Save deploy to history
    try {
      const now = new Date()
      const newEntry = {
        date: now.toISOString(),
        status: deploySuccess ? 'success' : 'error',
        by: session.email || session.name,
        message: deployData.message || (deploySuccess ? 'Deploy erfolgreich' : 'Deploy fehlgeschlagen'),
      }

      // Read existing history
      let history: any[] = []
      try {
        const raw = agent.deploy_history
        if (raw && typeof raw === 'string') {
          history = JSON.parse(raw)
        }
      } catch {}

      // Add new entry at beginning, keep max 50
      history.unshift(newEntry)
      if (history.length >= 50) history = history.slice(0, 50)

      const historyStr = JSON.stringify(history).replace(/'/g, "''")
      const historySql = `UPDATE agents SET deploy_history='${historyStr}' WHERE _id='${rowId}'`
      await fetch(
        `https://cloud.seatable.io/api-gateway/api/v2/dtables/${process.env.SEATABLE_UUID_AGENTS}/sql/`,
        {
          method: 'POST',
          headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: historySql })
        }
      )
      console.log('Deploy history saved')
    } catch (e) {
      console.error('Deploy history save error:', e)
    }

    return NextResponse.json({ success: deploySuccess, message: deployData.message || 'Deploy gestartet' })
  } catch (err) {
    console.error('Deploy error:', err)
    return NextResponse.json({ error: 'Deploy fehlgeschlagen' }, { status: 500 })
  }
}
