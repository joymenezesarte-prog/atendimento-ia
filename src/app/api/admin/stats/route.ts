import { NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const [
    { count: totalClients },
    { count: totalAgents },
    { count: activeAgents },
    { count: todayConversations },
    { data: clientsForMRR },
    { count: pendingPayments },
  ] = await Promise.all([
    db.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('agents').select('*', { count: 'exact', head: true }),
    db.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('conversations').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().slice(0, 10)),
    db.from('clients').select('plan_id').eq('status', 'active'),
    db.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
  ])

  const planPrices: Record<string, number> = {
    atendimento: 249,
    vendas: 499,
    operacao: 889,
  }
  const mrr = (clientsForMRR || []).reduce((acc, c) => {
    return acc + (planPrices[c.plan_id ?? ''] ?? 0)
  }, 0)

  return NextResponse.json({
    totalClients: totalClients ?? 0,
    totalAgents: totalAgents ?? 0,
    activeAgents: activeAgents ?? 0,
    todayConversations: todayConversations ?? 0,
    mrr,
    pendingPayments: pendingPayments ?? 0,
  })
}
