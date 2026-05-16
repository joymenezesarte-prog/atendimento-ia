import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'
import { createWebWidgetInbox, setChatwootAgentsOnline } from '@/lib/chatwoot'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const body = await request.json().catch(() => ({}))
  const force = body?.force === true

  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, name, chatwoot_website_token')
    .eq('id', id)
    .single()

  if (agentErr || !agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  // Se já tem token e não é force, só seta online e retorna
  if (agent.chatwoot_website_token && !force) {
    await setChatwootAgentsOnline()
    return NextResponse.json({ website_token: agent.chatwoot_website_token, already_existed: true })
  }

  // Cria novo widget + atribui agentes + seta online automaticamente
  const widget = await createWebWidgetInbox(`${agent.name} - Widget`)
  if (!widget) {
    return NextResponse.json({ error: 'Falha ao criar widget no Chatwoot. Verifique as variáveis CHATWOOT_*.' }, { status: 500 })
  }

  // Salva token no banco
  const { error: dbErr } = await db
    .from('agents')
    .update({ chatwoot_website_token: widget.website_token })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ website_token: widget.website_token, inbox_id: widget.inbox_id })
}
