import { NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  // Busca o agente do cliente com instagram inbox configurada
  const { data: agent } = await db
    .from('agents')
    .select('chatwoot_instagram_inbox_id')
    .eq('client_id', client.id)
    .not('chatwoot_instagram_inbox_id', 'is', null)
    .single()

  if (!agent?.chatwoot_instagram_inbox_id) {
    return NextResponse.json({ error: 'Instagram não configurado' }, { status: 404 })
  }

  // Busca conversas do Chatwoot para esse inbox
  const chatwootUrl = process.env.CHATWOOT_URL
  const chatwootToken = process.env.CHATWOOT_API_TOKEN
  const accountId = process.env.CHATWOOT_ACCOUNT_ID

  if (!chatwootUrl || !chatwootToken || !accountId) {
    return NextResponse.json({ error: 'Chatwoot não configurado' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `${chatwootUrl}/api/v1/accounts/${accountId}/conversations?inbox_id=${agent.chatwoot_instagram_inbox_id}&page=1`,
      { headers: { 'api_access_token': chatwootToken } }
    )
    if (!res.ok) throw new Error('Erro Chatwoot')
    const data = await res.json()
    const convs = (data.data?.payload || []).map((c: any) => ({
      id: c.id,
      contact_name: c.meta?.sender?.name || 'Usuário Instagram',
      last_message: c.last_non_activity_message?.content || '',
      created_at: c.created_at,
      status: c.status,
    }))
    return NextResponse.json(convs)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar conversas do Instagram' }, { status: 500 })
  }
}
