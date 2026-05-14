import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    company_name, contact_name, email, phone, plan_id, gemini_api_key,
    whatsapp_number, meta_phone_number_id, agent_name,
  } = body

  if (!company_name || !email) {
    return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const chatwootUrl  = process.env.CHATWOOT_URL
  const chatwootAcct = process.env.CHATWOOT_ACCOUNT_ID
  const chatwootTok  = process.env.CHATWOOT_API_TOKEN
  const metaToken    = process.env.META_WHATSAPP_TOKEN
  const metaWabaId   = process.env.META_BUSINESS_ACCOUNT_ID

  // ── 1. Criar usuário no Supabase Auth ──
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-10) + 'A1!',
    email_confirm: true,
    user_metadata: { company_name, full_name: contact_name || '' },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // ── 2. Criar registro do cliente ──
  const { data: client, error: clientError } = await db
    .from('clients')
    .upsert({
      user_id: authData.user.id,
      company_name,
      contact_name: contact_name || null,
      email,
      phone: phone || null,
      plan_id: plan_id || 'atendimento',
      status: 'trial',
      gemini_api_key: gemini_api_key || null,
    })
    .select()
    .single()

  if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 })

  // ── 3. Criar inbox no Chatwoot via API ──
  let inboxId: number | null = null
  let chatwootError: string | null = null

  if (whatsapp_number && meta_phone_number_id) {
    if (!chatwootUrl || !chatwootAcct || !chatwootTok || !metaToken || !metaWabaId) {
      chatwootError = 'Variáveis CHATWOOT_URL, CHATWOOT_ACCOUNT_ID, CHATWOOT_API_TOKEN, META_WHATSAPP_TOKEN ou META_BUSINESS_ACCOUNT_ID não configuradas no servidor.'
    } else {
      try {
        const res = await fetch(`${chatwootUrl}/api/v1/accounts/${chatwootAcct}/inboxes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api_access_token': chatwootTok,
          },
          body: JSON.stringify({
            name: `WhatsApp - ${company_name}`,
            channel: {
              type: 'whatsapp',
              phone_number: whatsapp_number,
              provider: 'whatsapp_cloud',
              provider_config: {
                api_key: metaToken,
                phone_number_id: meta_phone_number_id,
                business_account_id: metaWabaId,
              },
            },
          }),
        })
        const inboxData = await res.json()
        if (!res.ok) {
          chatwootError = inboxData?.message || inboxData?.error || `Chatwoot retornou ${res.status}`
        } else {
          inboxId = inboxData.id || null
        }
      } catch (e: unknown) {
        chatwootError = e instanceof Error ? e.message : 'Falha ao conectar com o Chatwoot'
      }
    }
  }

  // ── 4. Criar agente no Supabase vinculado à inbox ──
  let agent = null
  if (client && (inboxId || whatsapp_number)) {
    const { data: agentData } = await db
      .from('agents')
      .insert({
        client_id: client.id,
        name: agent_name || `Agente ${company_name}`,
        channel: 'whatsapp',
        phone_number: whatsapp_number || null,
        chatwoot_inbox_id: inboxId,
        status: 'active',
        personality: 'profissional, simpático e objetivo',
        instructions: `Você é um assistente de atendimento virtual para ${company_name}. Responda perguntas dos clientes de forma clara e educada.`,
        features: {},
      })
      .select()
      .single()
    agent = agentData
  }

  return NextResponse.json({
    client,
    inbox_id: inboxId,
    agent,
    chatwoot_error: chatwootError,
    status: inboxId
      ? 'completo'
      : chatwootError
        ? 'cliente_criado_sem_chatwoot'
        : 'cliente_criado_sem_whatsapp',
    message: inboxId
      ? `✅ Cliente criado, inbox WhatsApp #${inboxId} criada no Chatwoot e agente configurado automaticamente.`
      : chatwootError
        ? `⚠️ Cliente criado, mas a inbox do Chatwoot falhou: ${chatwootError}`
        : '✅ Cliente criado. Adicione o inbox_id manualmente no agente quando configurar o WhatsApp.',
  }, { status: 201 })
}
