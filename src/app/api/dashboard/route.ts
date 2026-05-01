import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: client } = await supabase.from('clients').select('id').eq('user_id', user.id).single()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const cid = client.id

  const [leads, conversations, appointments, agents] = await Promise.all([
    supabase.from('leads').select('id, stage, created_at').eq('client_id', cid),
    supabase.from('conversations').select('id, status, score').eq('client_id', cid),
    supabase.from('appointments').select('id, date, status').eq('client_id', cid).gte('date', new Date().toISOString().split('T')[0]),
    supabase.from('agents').select('id, name, status, conversations_count').eq('client_id', cid),
  ])

  const totalLeads = leads.data?.length || 0
  const newLeads = leads.data?.filter(l => l.stage === 'new').length || 0
  const activeConversations = conversations.data?.filter(c => c.status === 'active').length || 0
  const avgScore = conversations.data?.length ? Math.round(conversations.data.reduce((a, c) => a + (c.score || 0), 0) / conversations.data.length) : 0
  const todayAppointments = appointments.data?.filter(a => a.date === new Date().toISOString().split('T')[0]).length || 0

  return NextResponse.json({
    totalLeads,
    newLeads,
    activeConversations,
    avgScore,
    todayAppointments,
    agents: agents.data || [],
  })
}
