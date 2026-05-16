import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const body = await request.json().catch(() => ({}))
  const force = body?.force === true

  // Buscar dados do agente
  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, name, chatwoot_website_token')
    .eq('id', id)
    .single()

  if (agentErr || !agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  // Se já tem token e não é force, retornar o existente
  if (agent.chatwoot_website_token && !force) {
    return NextResponse.json({ website_token: agent.chatwoot_website_token, already_existed: true })
  }

  const CHATWOOT_URL = process.env.CHATWOOT_URL
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN

  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) {
    return NextResponse.json({ error: 'Variáveis CHATWOOT_* não configuradas' }, { status: 500 })
  }

  // Criar inbox no Chatwoot
  const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_access_token': CHATWOOT_API_TOKEN,
    },
    body: JSON.stringify({
      name: `${agent.name} - Widget`,
      channel: {
        type: 'web_widget',
        website_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: `Chatwoot error: ${err}` }, { status: 500 })
  }

  const inbox = await res.json()
  const websiteToken = inbox.website_token

  if (!websiteToken) {
    return NextResponse.json({ error: 'Token não retornado pelo Chatwoot' }, { status: 500 })
  }

  // Salvar token no banco
  const { error: dbErr } = await db
    .from('agents')
    .update({ chatwoot_website_token: websiteToken })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ website_token: websiteToken, inbox_id: inbox.id })
}
