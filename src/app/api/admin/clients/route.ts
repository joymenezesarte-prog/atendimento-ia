import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: clients, error } = await db
    .from('clients')
    .select(`
      id, company_name, contact_name, email, phone,
      plan_id, status, stripe_customer_id, gemini_api_key, modules,
      created_at, updated_at,
      agents(count),
      leads(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (clients || []).map(c => ({
    ...c,
    agent_count: Array.isArray(c.agents) ? c.agents[0]?.count ?? 0 : 0,
    lead_count: Array.isArray(c.leads) ? c.leads[0]?.count ?? 0 : 0,
  }))

  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company_name, contact_name, email, phone, plan_id, gemini_api_key } = body

  if (!company_name || !email) {
    return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  // Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await db.auth.admin.createUser({
    email,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
    user_metadata: { company_name, full_name: contact_name },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Cria o registro do cliente
  const { data, error } = await db
    .from('clients')
    .upsert({
      user_id: authData.user.id,
      company_name,
      contact_name,
      email,
      phone,
      plan_id: plan_id || 'atendimento',
      status: 'trial',
      gemini_api_key,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 