import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import crypto from 'crypto'

// Verifica assinatura do webhook Stripe sem SDK
function verifyStripeSignature(payload: string, sigHeader: string, secret: string): boolean {
  try {
    const parts = Object.fromEntries(sigHeader.split(',').map(p => {
      const idx = p.indexOf('=')
      return [p.slice(0, idx), p.slice(idx + 1)]
    }))
    const timestamp = parts['t']
    const expected = parts['v1']
    if (!timestamp || !expected) return false

    const signed = `${timestamp}.${payload}`
    const computed = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex')
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

// Envia mensagem pós-pagamento via Chatwoot
async function sendPostPaymentMessage(
  clientId: string,
  buyerPhone: string | null,
  buyerName: string,
  productId: string | null,
  db: ReturnType<typeof getSupabaseAdmin>
) {
  if (!buyerPhone) return

  const { data: product } = await db
    .from('products')
    .select('post_payment_action, post_payment_content')
    .eq('client_id', clientId)
    .eq('id', productId ?? '')
    .single()

  if (!product?.post_payment_content) return

  const { data: agent } = await db
    .from('agents')
    .select('chatwoot_inbox_id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .not('chatwoot_inbox_id', 'is', null)
    .single()

  if (!agent?.chatwoot_inbox_id) return

  const chatwootUrl = process.env.CHATWOOT_URL
  const chatwootToken = process.env.CHATWOOT_API_TOKEN
  const accountId = process.env.CHATWOOT_ACCOUNT_ID
  if (!chatwootUrl || !chatwootToken || !accountId) return

  try {
    // Busca ou cria contato
    const searchRes = await fetch(
      `${chatwootUrl}/api/v1/accounts/${accountId}/contacts/search?q=${buyerPhone}`,
      { headers: { 'api_access_token': chatwootToken } }
    )
    const searchData = await searchRes.json()
    let contactId = searchData?.payload?.[0]?.id

    if (!contactId) {
      const createRes = await fetch(
        `${chatwootUrl}/api/v1/accounts/${accountId}/contacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
          body: JSON.stringify({ name: buyerName, phone_number: buyerPhone.startsWith('+') ? buyerPhone : `+${buyerPhone}` }),
        }
      )
      const newContact = await createRes.json()
      contactId = newContact?.id
    }

    if (!contactId) return

    // Cria conversa
    const convRes = await fetch(
      `${chatwootUrl}/api/v1/accounts/${accountId}/conversations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
        body: JSON.stringify({ contact_id: contactId, inbox_id: agent.chatwoot_inbox_id }),
      }
    )
    const conv = await convRes.json()
    if (!conv?.id) return

    const msg = product.post_payment_action === 'message'
      ? product.post_payment_content
      : `Pagamento confirmado! ✅\n\n${product.post_payment_content}`

    await fetch(
      `${chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conv.id}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
        body: JSON.stringify({ content: msg, message_type: 'outgoing', private: false }),
      }
    )
  } catch (e) {
    console.error('Erro Chatwoot pós-Stripe:', e)
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const sigHeader = request.headers.get('stripe-signature') || ''

  const db = getSupabaseAdmin()

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Só processa checkout.session.completed (gerado por Payment Links)
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true })
  }

  const session = event.data?.object
  if (!session) return NextResponse.json({ ok: true })

  // client_id vem do metadata do Payment Link
  const clientId = session.metadata?.client_id || session.payment_link_metadata?.client_id
  if (!clientId) {
    console.error('Stripe webhook: client_id não encontrado no metadata')
    return NextResponse.json({ ok: true })
  }

  // Busca client e verifica assinatura com o webhook secret do cliente
  const { data: clientData } = await db
    .from('clients')
    .select('id, stripe_webhook_secret')
    .eq('id', clientId)
    .single()

  if (!clientData) return NextResponse.json({ ok: true })

  if (clientData.stripe_webhook_secret) {
    const valid = verifyStripeSignature(payload, sigHeader, clientData.stripe_webhook_secret)
    if (!valid) {
      console.error('Stripe webhook: assinatura inválida para client', clientId)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  }

  // Dados do comprador
  const buyerName = session.customer_details?.name || 'Cliente'
  const buyerEmail = session.customer_details?.email || null
  const buyerPhone = session.customer_details?.phone || null
  const amountTotal = session.amount_total ? session.amount_total / 100 : 0
  const stripeSessionId = session.id
  const paymentLinkId = session.payment_link

  // Evita processar duas vezes
  const { data: existingOrder } = await db
    .from('orders')
    .select('id')
    .eq('mp_payment_id', stripeSessionId) // reutilizamos mp_payment_id para o session id
    .single()

  if (existingOrder) return NextResponse.json({ ok: true })

  // Encontra o produto pelo payment_preference_id (= payment link ID)
  let productId: string | null = null
  if (paymentLinkId) {
    const { data: product } = await db
      .from('products')
      .select('id')
      .eq('client_id', clientId)
      .eq('payment_preference_id', paymentLinkId)
      .single()
    productId = product?.id ?? null
  }

  // Cria registro do pedido
  await db.from('orders').insert({
    client_id: clientId,
    product_id: productId,
    lead_phone: buyerPhone || buyerEmail || 'desconhecido',
    lead_name: buyerName,
    payment_provider: 'stripe',
    payment_preference_id: paymentLinkId,
    mp_payment_id: stripeSessionId,
    status: 'paid',
    paid_at: new Date().toISOString(),
  })

  // Envia mensagem pós-pagamento
  await sendPostPaymentMessage(clientId, buyerPhone, buyerName, productId, db)

  return NextResponse.json({ ok: true })
}
