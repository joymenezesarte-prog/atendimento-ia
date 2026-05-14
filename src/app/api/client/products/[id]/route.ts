import { NextRequest, NextResponse } from 'next/server'
import { requireClient, getSupabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await requireClient()
  if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const db = getSupabaseAdmin()

  // Verifica que o produto pertence ao cliente
  const { data: existing } = await db.from('products').select('id, client_id').eq('id', id).single()
  if (!existing || existing.client_id !== client.id) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  // Se mudou preço ou nome, regenera link MP
  if ((body.price || body.name) && existing) {
    const { data: clientData } = await db
      .from('clients')
      .select('mp_access_token')
      .eq('id', client.id)
      .single()

    const { data: product } = await db.from('products').select('*').eq('id', id).single()

    if (clientData?.mp_access_token && product?.payment_provider === 'mercadopago') {
      try {
        const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientData.mp_access_token}`,
          },
          body: JSON.stringify({
            items: [{
              title: body.name || product.name,
              description: body.description || product.description || '',
              quantity: 1,
              unit_price: Number(body.price || product.price),
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
          body.payment_preference_id = mpData.id
          body.payment_link = mpData.init_point
        }
      } catch (e) {
        console.error('Erro ao regen preferência MP:', e)
      }
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
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const { error } = await db.from('products').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
