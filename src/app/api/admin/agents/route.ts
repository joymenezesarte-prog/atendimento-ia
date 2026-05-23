import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('agents')
    .select(`
      id, name, channel, phone_number, status, personality, instructions,
      features, feature_config, chatwoot_inbox_id, chatwoot_website_token, chatwoot_instagram_inbox_id,
      google_calendar_id, google_refresh_token, notification_email,
      resend_api_key, gemini_api_key,
      conversations_count, leads_count, created_at, client_id,
      clients(id, company_name)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (data ?? []).map((a: any) => ({
    ...a,
    // google_connected = true somente se OAuth foi concluido (refresh_token salvo)
    google_connected: !!a.google_refresh_token,
    // Nunca expoe o refresh_token no frontend
    google_refresh_token: undefined,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { client_id, name, channel, personality, instructions, features } = body

  if (!client_id || !name || !channel) {
    return NextResponse.json({ error: 'client_id, name e channel sao obrigatorios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('agents')
    .insert({ client_id, name, channel, personality, instructions, features: features || {} })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
