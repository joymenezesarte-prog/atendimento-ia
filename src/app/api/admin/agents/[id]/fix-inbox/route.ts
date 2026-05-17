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
 * Corrige a inbox do widget do agente:
 *   1. Desativa horário de trabalho (elimina "Estamos ausentes")
 *   2. Cria automação n8n para o agente responder às mensagens
 *   3. Seta todos os agentes como online
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { data: agent, error: agentErr } = await db
    .from('agents')
    .select('id, name, chatwoot_website_token')
    .eq('id', id)
    .single()

  if (agentErr || !agent) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })
  if (!agent.chatwoot_website_token) {
    return NextResponse.json({ error: 'Agente não tem widget configurado. Crie o widget primeiro.' }, { status: 400 })
  }

  // Busca ID da inbox no Chatwoot pelo website_token
  const inboxId = await findInboxIdByWebsiteToken(agent.chatwoot_website_token)
  if (!inboxId) {
    return NextResponse.json({ error: 'Inbox não encontrada no Chatwoot. O token pode estar desatualizado — recrie o widget.' }, { status: 404 })
  }

  // Executa as correções em paralelo
  const [, automationResult] = await Promise.all([
    disableInboxWorkingHours(inboxId),
    createN8nAutomation(inboxId, agent.name),
    setChatwootAgentsOnline(),
  ])

  return NextResponse.json({
    inbox_id: inboxId,
    working_hours_disabled: true,
    automation_created: automationResult.ok,
    automation_message: automationResult.ok
      ? `Automação criada — o agente IA agora responde via n8n.`
      : `Aviso: ${automationResult.reason}`,
  })
}
