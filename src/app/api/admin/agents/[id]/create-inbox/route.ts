import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, name, phone_number, chatwoot_inbox_id')
    .eq('id', id)
    .single()

  if (agentErr || !agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  if (agent.chatwoot_inbox_id) {
    return NextResponse.json({ inbox_id: agent.chatwoot_inbox_id, already_existed: true })
  }

  const CHATWOOT_URL = process.env.CHATWOOT_URL
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN

  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) {
    return NextResponse.json({ error: 'Variáveis CHATWOOT_* não configuradas' }, { status: 500 })
  }

  const inboxName = agent.name + (agent.phone_number ? ' (' + agent.phone_number + ')' : '')

  const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': CHATWOOT_API_TOKEN,
    },
    body: JSON.stringify({
      name: inboxName,
      channel: {
        type: 'api',
        webhook_url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud') + '/api/webhooks/chatwoot/' + id,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: 'Chatwoot error: ' + err }, { status: 500 })
  }

  const inbox = await res.json()
  const inboxId = inbox.id

  if (!inboxId) return NextResponse.json({ error: 'ID não retornado pelo Chatwoot' }, { status: 500 })

  const { error: dbErr } = await db
    .from('agents')
    .update({ chatwoot_inbox_id: inboxId })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ inbox_id: inboxId, inbox_name: inboxName })
}
