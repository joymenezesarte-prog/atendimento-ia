import { NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const [
    { data: leads },
    { data: conversations },
    { data: clients },
  ] = await Promise.all([
    db.from('leads').select('stage, score, created_at, client_id, clients(company_name)'),
    db.from('conversations').select('status, created_at, client_id'),
    db.from('clients').select('id, company_name, plan_id, status, created_at'),
  ])

  const planPrices: Record<string, number> = { atendimento: 249, vendas: 499, operacao: 889 }

  // Leads por estagio
  const stageLabels: Record<string, string> = {
    new: 'Novo', quote_sent: 'Orcamento', waiting_payment: 'Aguard. Pgto',
    scheduled: 'Agendado', done: 'Finalizado',
  }
  const byStage = Object.entries(stageLabels).map(([id, name]) => ({
    name,
    value: (leads ?? []).filter(l => l.stage === id).length,
  }))

  // Leads por cliente (top 6)
  const byClient: Record<string, number> = {}
  for (const l of leads ?? []) {
    const c = l.clients as unknown as { company_name: string } | null
    const name = c?.company_name ?? 'Outros'
    byClient[name] = (byClient[name] ?? 0) + 1
  }
  const leadsByClient = Object.entries(byClient)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // Leads por dia (ultimos 7 dias)
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
  const weeklyLeads = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    const dayLeads = (leads ?? []).filter(l => String(l.created_at).slice(0, 10) === dayStr)
    return {
      day: dayNames[d.getDay()],
      leads: dayLeads.length,
      converted: dayLeads.filter(l => l.stage === 'done').length,
    }
  })

  // MRR por mes (ultimos 4 meses)
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const monthlyRevenue = Array.from({ length: 4 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (3 - i))
    const cutoff = d.getTime()
    const value = (clients ?? [])
      .filter(c => c.status === 'active' && new Date(String(c.created_at)).getTime() <= cutoff)
      .reduce((acc, c) => acc + (planPrices[c.plan_id ?? ''] ?? 0), 0)
    return { month: monthNames[d.getMonth()], value }
  })

  // KPIs
  const totalLeads = (leads ?? []).length
  const convertedLeads = (leads ?? []).filter(l => l.stage === 'done').length
  const avgScore = totalLeads > 0
    ? Math.round((leads ?? []).reduce((a, l) => a + (l.score ?? 0), 0) / totalLeads * 10) / 10
    : 0
  const activeConversations = (conversations ?? []).filter(c => c.status === 'active').length
  const mrr = (clients ?? [])
    .filter(c => c.status === 'active')
    .reduce((acc, c) => acc + (planPrices[c.plan_id ?? ''] ?? 0), 0)
  const totalClients = (clients ?? []).length

  return NextResponse.json({
    kpis: { totalLeads, convertedLeads, avgScore, activeConversations, mrr, totalClients },
    byStage,
    leadsByClient,
    weeklyLeads,
    monthlyRevenue,
  })
}
