import { NextRequest, NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .select('mp_access_token, stripe_secret_key, stripe_webhook_secret')
    .eq('id', client.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    mp_access_token: data?.mp_access_token ?? null,
    stripe_secret_key: data?.stripe_secret_key ?? null,
    stripe_webhook_secret: data?.stripe_webhook_secret ?? null,
  })
}

export async function PATCH(request: NextRequest) {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Record<string, string | null> = {}

  if ('mp_access_token' in body) updates.mp_access_token = body.mp_access_token || null
  if ('stripe_secret_key' in body) updates.stripe_secret_key = body.stripe_secret_key || null
  if ('stripe_webhook_secret' in body) updates.stripe_webhook_secret = body.stripe_webhook_secret || null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', client.id)
    .select('mp_access_token, stripe_secret_key, stripe_webhook_secret')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
