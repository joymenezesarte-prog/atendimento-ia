import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')

  let query = supabase.from('leads').select('*').eq('client_id', client.id).order('created_at', { ascending: false })
  if (stage) query = query.eq('stage', stage)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await supabase.from('leads').insert({ ...body, client_id: client.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
