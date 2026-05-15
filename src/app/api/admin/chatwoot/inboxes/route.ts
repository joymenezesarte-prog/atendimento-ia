import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const CHATWOOT_URL = process.env.CHATWOOT_URL
  const CHATWOOT_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID
  const CHATWOOT_API_TOKEN = process.env.CHATWOOT_API_TOKEN

  if (!CHATWOOT_URL || !CHATWOOT_ACCOUNT_ID || !CHATWOOT_API_TOKEN) {
    return NextResponse.json({ error: 'Variáveis CHATWOOT_* não configuradas' }, { status: 500 })
  }

  const res = await fetch(`${CHATWOOT_URL}/api/v1/accounts/${CHATWOOT_ACCOUNT_ID}/inboxes`, {
    headers: { 'api_access_token': CHATWOOT_API_TOKEN },
  })

  if (!res.ok) return NextResponse.json({ error: 'Erro ao buscar inboxes' }, { status: 500 })

  const data = await res.json()
  const inboxes = (data.payload || []).map((inbox: { id: number; name: string; channel_type: string }) => ({
    id: inbox.id,
    name: inbox.name,
    channel_type: inbox.channel_type,
  }))

  return NextResponse.json(inboxes)
}
