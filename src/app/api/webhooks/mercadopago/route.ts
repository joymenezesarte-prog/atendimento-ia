import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = getSupabaseAdmin()

    // MP envia tipo "payment" quando pagamento é processado
    if (body.type !== 'payment' || !body.data?.id) {
      return NextResponse.json({ ok: true })
    }

    const paymentId = String(body.data.id)

    // Busca detalhes do pagamento na API do MP
    // Precisamos identificar o cliente pelo token — vamos buscar todos os clientes com MP token
    const { data: clients } = await db
      .from('clients')
      .select('id, mp_access_token')
      .not('mp_access_token', 'is', null)

    if (!clients?.length) return NextResponse.json({ ok: true })

    let paymentData: any = null
    let matchedClient: any = null

    // Tenta cada cliente até achar o dono do pagamento
    for (const c of clients) {
      if (!c.mp_access_token) continue
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${c.mp_access_token}` },
      })
      if (mpRes.ok) {
        paymentData = await mpRes.json()
        matchedClient = c
        break
      }
    }

    if (!paymentData || !matchedClient) {
      return NextResponse.json({ ok: true })
    }

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    // Busca ou cria order
    const { data: existingOrder } = await db
      .from('orders')
      .select('*')
      .eq('payment_id', paymentId)
      .single()

    if (existingOrder?.post_payment_sent) {
      return NextResponse.json({ ok: true }) // já processado
    }

    // Pega info do comprador
    const buyerPhone = paymentData.payer?.phone?.number
      ? `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}`
      : null
    const buyerEmail = paymentData.payer?.email || null
    const buyerName = paymentData.payer?.first_name || 'Cliente'
    const amount = paymentData.transaction_amount

    // Identifica produto pelo external_reference (order_id) ou pelo título
    let productId: string | null = null
    let order = existingOrder

    if (paymentData.external_reference) {
      const { data: orderByRef } = await db
        .from('orders')
        .select('*')
        .eq('id', paymentData.external_reference)
        .single()
      if (orderByRef) order = orderByRef
    }

    if (!order) {
      // Cria order se não existe
      const { data: newOrder } = await db
        .from('orders')
        .insert({
          client_id: matchedClient.id,
          product_id: productId,
          buyer_name: buyerName,
          buyer_phone: buyerPhone,
          buyer_email: buyerEmail,
          payment_provider: 'mercadopago',
          payment_id: paymentId,
          payment_status: 'approved',
          amount,
        })
        .select()
        .single()
      order = newOrder
    } else {
      await db.from('orders').update({ payment_status: 'approved' }).eq('id', order.id)
    }

    if (!order) return NextResponse.json({ ok: true })

    // Busca o produto para pegar a ação pós-pagamento
    const { data: product } = await db
      .from('products')
      .select('*')
      .eq('client_id', matchedClient.id)
      .eq('id', order.product_id)
      .single()

    // Busca configuração do Chatwoot do cliente
    const { data: clientFull } = await db
      .from('clients')
      .select('id')
      .eq('id', matchedClient.id)
      .single()

    // Busca um agente do cliente para pegar o chatwoot_inbox_id
    const { data: agent } = await db
      .from('agents')
      .select('chatwoot_inbox_id, phone_number')
      .eq('client_id', matchedClient.id)
      .eq('status', 'active')
      .not('chatwoot_inbox_id', 'is', null)
      .single()

    // Envia mensagem pós-pagamento via Chatwoot se tiver número do comprador
    if (buyerPhone && agent?.chatwoot_inbox_id && product?.post_payment_content) {
      const chatwootUrl = process.env.CHATWOOT_URL
      const chatwootToken = process.env.CHATWOOT_API_TOKEN
      const accountId = process.env.CHATWOOT_ACCOUNT_ID

      if (chatwootUrl && chatwootToken && accountId) {
        try {
          // Busca ou cria contato no Chatwoot
          const contactRes = await fetch(
            `${chatwootUrl}/api/v1/accounts/${accountId}/contacts/search?q=${buyerPhone}`,
            { headers: { 'api_access_token': chatwootToken } }
          )
          const contactData = await contactRes.json()
          let contactId = contactData?.payload?.[0]?.id

          if (!contactId) {
            const createContact = await fetch(
              `${chatwootUrl}/api/v1/accounts/${accountId}/contacts`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
                body: JSON.stringify({ name: buyerName, phone_number: `+${buyerPhone}` }),
              }
            )
            const newContact = await createContact.json()
            contactId = newContact?.id
          }

          if (contactId) {
            // Cria conversa
            const convRes = await fetch(
              `${chatwootUrl}/api/v1/accounts/${accountId}/conversations`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
                body: JSON.stringify({
                  contact_id: contactId,
                  inbox_id: agent.chatwoot_inbox_id,
                }),
              }
            )
            const conv = await convRes.json()

            if (conv?.id) {
              const postPaymentMsg = product.post_payment_action === 'message'
                ? product.post_payment_content
                : `Pagamento confirmado! ✅\n\n${product.post_payment_content}`

              await fetch(
                `${chatwootUrl}/api/v1/accounts/${accountId}/conversations/${conv.id}/messages`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'api_access_token': chatwootToken },
                  body: JSON.stringify({ content: postPaymentMsg, message_type: 'outgoing', private: false }),
                }
              )
            }
          }
        } catch (e) {
          console.error('Erro ao enviar mensagem pós-pagamento:', e)
        }
      }
    }

    // Marca order como enviada
    await db.from('orders').update({ post_payment_sent: true, payment_status: 'approved' }).eq('id', order.id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Webhook MP erro:', e)
    return NextResponse.json({ ok: true }) // sempre retorna 200 para o MP
  }
}

export async function GET(request: NextRequest) {
  // MP faz GET para verificar o endpoint
  return NextResponse.json({ ok: true })
}
