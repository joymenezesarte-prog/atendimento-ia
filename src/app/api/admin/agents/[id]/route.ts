import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'
import { setChatwootAgentsOnline, createN8nAutomation, disableInboxWorkingHours } from '@/lib/chatwoot'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const db = getSupabaseAdmin()

  // Busca nome do agente para usar na automação (se necessário)
  const { data: existing } = await db.from('agents').select('name').eq('id', id).single()

  const { data, error } = await db
    .from('agents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Seta agentes online sempre que salvar
  setChatwootAgentsOnline().catch(() => {})

  const agentName = existing?.name || 'Agente'

  // Se está salvando uma inbox de Instagram, cria automação n8n + desativa working hours
  if (body.chatwoot_instagram_inbox_id) {
    const inboxId = Number(body.chatwoot_instagram_inbox_id)
    disableInboxWorkingHours(inboxId).catch(() => {})
    createN8nAutomation(inboxId, `${agentName} - Instagram`).catch(() => {})
  }

  // Se está salvando uma inbox de WhatsApp (chatwoot_inbox_id), cria automação n8n + desativa working hours
  if (body.chatwoot_inbox_id) {
    const inboxId = Number(body.chatwoot_inbox_id)
    disableInboxWorkingHours(inboxId).catch(() => {})
    createN8nAutomation(inboxId, `${agentName} - WhatsApp`).catch(() => {})
  }

  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()
  const { error } = await db.from('agents').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
