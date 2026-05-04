import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId
        if (userId && planId) {
          await supabaseAdmin
            .from('clients')
            .update({
              plan_id: planId,
              status: 'active',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer as string
        const status = sub.status === 'active' ? 'active' : sub.status === 'trialing' ? 'trial' : 'inactive'
        await supabaseAdmin
          .from('clients')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const customerId = sub.customer as string
        await supabaseAdmin
          .from('clients')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = invoice.customer as string
        await supabaseAdmin
          .from('clients')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', customerId)
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }

  return NextResponse.json({ received: true })
}
