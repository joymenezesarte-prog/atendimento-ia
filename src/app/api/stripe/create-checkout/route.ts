import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanId } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, userEmail } = await request.json()

    const plan = PLANS[planId as PlanId]
    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      line_items: [
        { price: plan.monthly_price_id, quantity: 1 },
      ],
      subscription_data: {
        trial_period_days: plan.trial_days,
        metadata: { userId, planId },
      },
      metadata: { userId, planId },
      success_url: `${siteUrl}/dashboard?success=true&plan=${planId}`,
      cancel_url: `${siteUrl}/planos?canceled=true`,
    })

    if (session.customer) {
      await stripe.invoiceItems.create({
        customer: session.customer as string,
        price_data: {
          currency: 'brl',
          product: plan.product_id,
          unit_amount: plan.implantation,
        },
        description: `Taxa de implantação — ${plan.name}`,
      })
      const invoice = await stripe.invoices.create({
        customer: session.customer as string,
        auto_advance: true,
      })
      await stripe.invoices.finalizeInvoice(invoice.id)
      await stripe.invoices.pay(invoice.id)
    }

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro ao criar checkout:', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
