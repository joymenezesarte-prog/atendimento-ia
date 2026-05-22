import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Chamado pelo n8n a cada mensagem recebida/enviada
// Garante que conversa e lead existam antes de salvar mensagens
// POST /api/internal/sync-conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      agent_id,
      chatwoot_conv_id,   // ID da conversa no Chatwoot (string)
      lead_name,
      lead_phone,
      lead_email,
      channel = 'whatsapp',
      last_message,
      score = 0,
      // Se quiser salvar a mensagem junto (opcional)
      message_role,       // 'user' | 'assistant'
      message_content,
    } = body

    if (!agent_id) {
      return NextResponse.json({ error: 'agent_id e obrigatorio' }, { status: 400 })
    }
    if (!chatwoot_conv_id) {
      return NextResponse.json({ error: 'chatwoot_conv_id e obrigatorio' }, { status: 400 })
    }

    const db = getSupabaseAdmin()

    // 1. Busca agent para obter client_id
    const { data: agent, error: agentError } = await db
      .from('agents')
      .select('id, client_id, name')
      .eq('id', agent_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agente nao encontrado' }, { status: 404 })
    }

    const clientId = agent.client_id

    // 2. Upsert lead pelo telefone (ou cria novo se nao existir)
    let leadId: string | null = null

    if (lead_phone) {
      const { data: existingLead } = await db
        .from('leads')
        .select('id')
        .eq('client_id', clientId)
        .eq('phone', lead_phone)
        .single()

      if (existingLead) {
        leadId = existingLead.id
        // Atualiza dados do lead se necessario
        await db
          .from('leads')
          .update({
            name: lead_name || undefined,
            email: lead_email || undefined,
            last_contact: new Date().toISOString(),
            score: score || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadId)
      } else {
        // Cria novo lead
        const { data: newLead, error: leadError } = await db
          .from('leads')
          .insert({
            client_id: clientId,
            agent_id: agent_id,
            name: lead_name || 'Lead',
            phone: lead_phone,
            email: lead_email || null,
            channel,
            score: score || 0,
            last_contact: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (leadError) {
          console.error('Erro ao criar lead:', leadError)
        } else {
          leadId = newLead.id
          // Incrementa leads_count no agente
          await db.rpc('increment_agent_leads', { p_agent_id: agent_id }).catch(() => {})
        }
      }
    }

    // 3. Upsert conversation pelo chatwoot_conv_id + agent_id
    const { data: existingConv } = await db
      .from('conversations')
      .select('id')
      .eq('agent_id', agent_id)
      .eq('chatwoot_conv_id', chatwoot_conv_id)
      .single()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id
      // Atualiza last_message e score
      await db
        .from('conversations')
        .update({
          last_message: last_message || undefined,
          last_message_at: new Date().toISOString(),
          score: score || undefined,
          lead_id: leadId || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
    } else {
      // Cria nova conversa
      const { data: newConv, error: convError } = await db
        .from('conversations')
        .insert({
          client_id: clientId,
          agent_id: agent_id,
          lead_id: leadId || null,
          chatwoot_conv_id: chatwoot_conv_id,
          lead_name: lead_name || 'Lead',
          lead_phone: lead_phone || null,
          channel,
          status: 'active',
          score: score || 0,
          last_message: last_message || null,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (convError || !newConv) {
        console.error('Erro ao criar conversa:', convError)
        return NextResponse.json(
          { error: 'Erro ao criar conversa', detail: convError?.message },
          { status: 500 }
        )
      }
      conversationId = newConv.id

      // Incrementa conversations_count no agente
      await db.rpc('increment_agent_conversations', { p_agent_id: agent_id }).catch(() => {})
    }

    // 4. Salva mensagem se fornecida
    if (message_content && message_role) {
      const validRole = ['user', 'assistant', 'system'].includes(message_role) ? message_role : 'user'
      await db.from('messages').insert({
        conversation_id: conversationId,
        role: validRole,
        content: message_content,
      })
    }

    return NextResponse.json({
      status: 'ok',
      conversation_id: conversationId,
      lead_id: leadId,
      client_id: clientId,
    })
  } catch (err: any) {
    console.error('Erro em sync-conversation:', err)
    return NextResponse.json(
      { error: err.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
