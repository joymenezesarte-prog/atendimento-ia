import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Chamado pelo n8n quando o agente quer enviar um link de pagamento
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { client_id, product_id, lead_phone, lead_name, lead_email } = body

  if (!client_id || !product_id || !lead_phone) {
    return NextResponse.json({ error: 'client_id, product_id e lead_phone são obrigatórios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()

  const [{ data: product }, { data: client }] = await Promise.all([
    db.from('products').select('*').eq('id', product_id).eq('client_id', client_id).single(),
    db.from('clients').select('mp_access_token, stripe_secret_key').eq('id', client_id).single(),
  ])

  if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

  // Cria order primeiro para ter o ID como external_reference
  const { data: order } = await db
    .from('orders')
    .insert({
      client_id,
      product_id,
      buyer_name: lead_name || 'Cliente',
      buyer_phone: lead_phone,
      buyer_email: lead_email || null,
      payment_provider: product.payment_provider,
      payment_status: 'pending',
      amount: product.price,
    })
    .select()
    .single()

  if (!order) return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 })

  // Gera link MP personalizado com external_reference = order.id
  let paymentUrl = product.payment_link // fallback para o link genérico

  if (product.payment_provider === 'mercadopago' && client?.mp_access_token) {
    try {
      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.mp_access_token}`,
        },
        body: JSON.stringify({
          items: [{
            title: product.name,
            description: product.description || product.name,
            quantity: 1,
            unit_price: Number(product.price),
            currency_id: 'BRL',
          }],
          payer: {
            name: lead_name || '',
            email: lead_email || '',
          },
          external_reference: order.id,
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
        paymentUrl = mpData.init_point
        await db.from('orders').update({ payment_id: mpData.id }).eq('id', order.id)
      }
    } catch (e) {
      console.error('Erro ao criar preferência MP personalizada:', e)
    }
  }

  return NextResponse.json({
    order_id: order.id,
    payment_url: paymentUrl,
    product_name: product.name,
    price: product.price,
  })
}
