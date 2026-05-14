import { NextResponse } from 'next/server'
import { requireAdmin, getSupabaseAdmin } from '@/lib/supabase-admin'

const planPrices: Record<string, number> = {
  atendimento: 249,
  vendas: 499,
  operacao: 889,
}

const planNames: Record<string, string> = {
  atendimento: 'Atendimento IA',
  vendas: 'Vendas IA',
  operacao: 'Operação IA',
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()

  const { data: clients, error } = await db
    .from('clients')
    .select('id, company_name, email, plan_id, status, stripe_customer_id, created_at')
    .neq('is_admin', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const activeClients = (clients || []).filter(c => c.status === 'active' && c.plan_id)
  const mrr = activeClients.reduce((acc, c) => acc + (planPrices[c.plan_id ?? ''] ?? 0), 0)
  const pendingClients = (clients || []).filter(c => c.status === 'inactive')

  const invoices = (clients || [])
    .filter(c => c.plan_id)
    .map(c => ({
      client: c.company_name,
      email: c.email,
      plan: planNames[c.plan_id ?? ''] ?? c.plan_id,
      amount: planPrices[c.plan_id ?? ''] ?? 0,
      status: c.status === 'active' ? 'paid' : 'pending',
      date: new Date(c.created_at).toLocaleDateString('pt-BR'),
    }))

  return NextResponse.json({
    mrr,
    pendingTotal: pendingClients.reduce((acc, c) => acc + (planPrices[c.plan_id ?? ''] ?? 0), 0),
    pendingCount: pendingClients.length,
    invoices,
  })
}
