import { NextRequest, NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

// Gera link Mercado Pago
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

// Gera Payment Link Stripe
async function generateStripeLink(secretKey: string, name: string, price: number, clientId: string, siteUrl: string) {
  const headers = {
    'Authorization': `Bearer ${secretKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // 1. Cria Price (em centavos)
  const priceBody = new URLSearchParams({
    'unit_amount': String(Math.round(price * 100)),
    'currency': 'brl',
    'product_data[name]': name,
  })
  const priceRes = await fetch('https://api.stripe.com/v1/prices', { method: 'POST', headers, body: priceBody })
  if (!priceRes.ok) return null
  const priceData = await priceRes.json()

  // 2. Cria Payment Link
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
    return NextResponse.json({ error: 'name e price são obrigatórios' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const siteUrl = pro