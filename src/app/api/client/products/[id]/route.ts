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
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  // Regenera link se mudou preço, nome ou provedor
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
        const result = await generateMPLink(clientData.mp_access_token, name, description, price, site