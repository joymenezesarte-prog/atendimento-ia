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
    return NextResponse.json({ error: 'name e price sao obrigatorios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.atendimentoia.cloud'

  const { data: clientData } = await db
    .from('clients')
    .select('mp_access_token, stripe_secret_key')
    .eq('id', client.id)
    .single()

  let payment_link = null
  let payment_preference_id = null

  if (payment_provider === 'mercadopago' && clientData?.mp_access_token) {
    try {
      const result = await generateMPLink(clientData.mp_access_token, name, description || name, Number(price), siteUrl)
      if (result) { payment_preference_id = result.id; payment_link = result.url }
    } catch (e) { console.error('Erro MP:', e) }
  }

  if (payment_provider === 'stripe' && clientData?.stripe_secret_key) {
    try {
      const result = await generateStripeLink(clientData.stripe_secret_key, name, Number(price), client.id, siteUrl)
      if (result) { payment_preference_id = result.id; payment_link = result.url }
    } catch (e) { console.error('Erro Stripe:', e) }
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
