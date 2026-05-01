import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Cliente Supabase com service role para operações no servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook inválido:', error)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // Checkout concluído — implantação paga, trial iniciado
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        const { userId, planId } = session.metadata || {}

        if (userId && planId) {
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'trialing',
            implantation_paid: true,
            trial_start: new Date().toISOString(),
            trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
        break
      }

      // Assinatura ativada após trial (mês 2 em diante)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const { userId, planId } = subscription.metadata || {}

        if (userId) {
          await supabase.from('subscriptions').update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            plan_id: planId || undefined,
          }).eq('stripe_subscription_id', subscription.id)
        }
        break
      }

      // Pagamento mensal realizado com sucesso
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabase.from('subscriptions').update({
            status: 'active',
            last_payment_at: new Date().toISOString(),
          }).eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      // Pagamento falhou
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabase.from('subscriptions').update({
            status: 'past_due',
          }).eq('stripe_subscription_id', invoice.subscription as string)
        }
        break
      }

      // Assinatura cancelada
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await supabase.from('subscriptions').update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
        }).eq('stripe_subscription_id', subscription.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
