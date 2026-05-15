import { NextRequest, NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

async function generateMPLink(token: string, name: string, description: string, price: number, siteUrl: string) {
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      items: [{ title: name, description: description || name, quantity: 1, unit_price: price, currency_id: 'BRL' }],
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${siteUrl}/pagamento/sucesso`,
        failure: `${siteUrl}/pagamento/falha`,
        pending: `${siteUrl}/pagamento/pendente`,
      },
      auto_return: 'approved',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return { id: data.id, url: data.init_point }
}

async function generateStripeLink(secretKey: string, name: string, price: number, clientId: string, siteUrl: string) {
  const headers = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }
  const priceBody = new URLSearchParams({
    'unit_amount': String(Math.round(price * 100)),
    'currency': 'brl',
    'product_data[name]': name,
  })
  const priceRes = await fetch('https://api.stripe.com/v1/prices', { method: 'POST', headers, body: priceBody })
  if (!priceRes.ok) return null
  const priceData = await priceRes.json()

  const linkBody = new URLSearchParams({
    'line_items[0][price]': priceData.id,
    'line_items[0][quantity]': '1',
    'metadata[client_id]': clientId,
    'phone_number_collection[enabled]': 'true',
    'after_completion[type]': 'redirect',
    'after_completion[redirect][url]': `${siteUrl}/pagamento/sucesso`,
  })
  const linkRes = await fetch('https://api.stripe.com/v1/payment_links', { method: 'POST', headers, body: linkBody })
  if (!linkRes.ok) return null
  const linkData = await linkRes.json()
  return { id: linkData.id, url: linkData.url }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const db = getSupabaseAdmin()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud'

  const { data: existing } = await db.from('products').select('*').eq('id', id).single()
  if (!existing || existing.client_id !== client.id) {
    return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
  }

  if (body.price || body.name || body.payment_provider) {
    const { data: clientData } = await db
      .from('clients')
      .select('mp_access_token, stripe_secret_key')
      .eq('id', client.id)
      .single()

    const provider = body.payment_provider || existing.payment_provider
    const name = body.name || existing.name
    const description = body.description || existing.description || ''
    const price = Number(body.price || existing.price)

    if (provider === 'mercadopago' && clientData?.mp_access_token) {
      try {
        const result = await generateMPLink(clientData.mp_access_token, name, description, price, siteUrl)
        if (result) { body.payment_preference_id = result.id; body.payment_link = result.url }
      } catch (e) { console.error('Erro regen MP:', e) }
    }

    if (provider === 'stripe' && clientData?.stripe_secret_key) {
      try {
        const result = await generateStripeLink(clientData.stripe_secret_key, name, price, client.id, siteUrl)
        if (result) { body.payment_preference_id = result.id; body.payment_link = result.url }
      } catch (e) { console.error('Erro regen Stripe:', e) }
    }
  }

  const { data, error } = await db
    .from('products')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const db = getSupabaseAdmin()

  const { data: existing } = await db.from('products').select('client_id').eq('id', id).single()
  if (!existing || existing.client_id !== client.id) {
    return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
  }

  const { error } = await db.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
