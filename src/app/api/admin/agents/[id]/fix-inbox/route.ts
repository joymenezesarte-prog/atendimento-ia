import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'
import {
  findInboxIdByWebsiteToken,
  disableInboxWorkingHours,
  createN8nAutomation,
  setChatwootAgentsOnline,
} from '@/lib/chatwoot'

/**
 * POST /api/admin/agents/[id]/fix-inbox
 * Corrige TODOS os canais do agente (WhatsApp, Instagram, Widget):
 *   1. Desativa horário de trabalho em cada inbox (elimina "Estamos ausentes")
 *   2. Cria automação n8n por inbox para o agente responder mensagens
 *   3. Seta todos os agentes Chatwoot como online
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, name, chatwoot_inbox_id, chatwoot_instagram_inbox_id, chatwoot_website_token')
    .eq('id', id)
    .single()

  if (agentErr || !agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

  const results: Record<string, { inbox_id: number | null; working_hours_disabled: boolean; automation: { ok: boolean; reason?: string } }> = {}

  // ── WhatsApp inbox ──
  if (agent.chatwoot_inbox_id) {
    const [, autoResult] = await Promise.all([
      disableInboxWorkingHours(agent.chatwoot_inbox_id),
      createN8nAutomation(agent.chatwoot_inbox_id, `${agent.name} - WhatsApp`),
    ])
    results.whatsapp = { inbox_id: agent.chatwoot_inbox_id, working_hours_disabled: true, automation: autoResult }
  }

  // ── Instagram inbox ──
  if (agent.chatwoot_instagram_inbox_id) {
    const [, autoResult] = await Promise.all([
      disableInboxWorkingHours(agent.chatwoot_instagram_inbox_id),
      createN8nAutomation(agent.chatwoot_instagram_inbox_id, `${agent.name} - Instagram`),
    ])
    results.instagram = { inbox_id: agent.chatwoot_instagram_inbox_id, working_hours_disabled: true, automation: autoResult }
  }

  // ── Web Widget inbox (lookup por token) ──
  if (agent.chatwoot_website_token) {
    const widgetInboxId = await findInboxIdByWebsiteToken(agent.chatwoot_website_token)
    if (widgetInboxId) {
      const [, autoResult] = await Promise.all([
        disableInboxWorkingHours(widgetInboxId),
        createN8nAutomation(widgetInboxId, `${agent.name} - Widget`),
      ])
      results.widget = { inbox_id: widgetInboxId, working_hours_disabled: true, automation: autoResult }
    } else {
      results.widget = { inbox_id: null, working_hours_disabled: false, automation: { ok: false, reason: 'Inbox não encontrada no Chatwoot — recrie o widget.' } }
    }
  }

  // Seta todos os agentes online
  await setChatwootAgentsOnline()

  const hasAny = Object.keys(results).length > 0
  if (!hasAny) {
    return NextResponse.json({ error: 'Agente não tem nenhuma inbox configurada (WhatsApp, Instagram ou Widget).' }, { status: 400 })
  }

  const allAutomationsOk = Object.values(results).every(r => r.automation.ok)
  const channels = Object.keys(results).join(', ')

  return NextResponse.json({
    results,
    summary: allAutomationsOk
      ? `✅ Automações n8n criadas para: ${channels}`
      : `⚠️ Inboxes corrigidas. Alguns canais precisam de N8N_WEBHOOK_URL configurada.`,
  })
}
