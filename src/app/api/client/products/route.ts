import { NextRequest, NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, description, price, payment_provider, post_payment_action, post_payment_content } = body

  if (!name || !price) {
    return NextResponse.json({ error: 'name e price são obrigatórios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  // Busca token do cliente
  const { data: clientData } = await db
    .from('clients')
    .select('mp_access_token, stripe_secret_key')
    .eq('id', client.id)
    .single()

  let payment_link = null
  let payment_preference_id = null

  // Gera link MP automaticamente se token disponível
  if (payment_provider === 'mercadopago' && clientData?.mp_access_token) {
    try {
      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientData.mp_access_token}`,
        },
        body: JSON.stringify({
          items: [{
            title: name,
            description: description || name,
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL',
          }],
          notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/mercadopago`,
          back_urls: {
            success: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/sucesso`,
            failure: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/falha`,
            pending: `${process.env.NEXT_PUBLIC_SITE_URL}/pagamento/pendente`,
          },
          auto_return: 'approved',
        }),
      })
      if (mpRes.ok) {
        const mpData = await mpRes.json()
        payment_preference_id = mpData.id
        payment_link = mpData.init_point // URL de produção
      }
    } catch (e) {
      console.error('Erro ao criar preferência MP:', e)
    }
  }

  const { data, error } = await db
    .from('products')
    .insert({
      client_id: client.id,
      name,
      description: description || null,
      price: Number(price),
      payment_provider: payment_provider || 'mercadopago',
      payment_link,
      payment_preference_id,
      post_payment_action: post_payment_action || 'message',
      post_payment_content: post_payment_content || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
