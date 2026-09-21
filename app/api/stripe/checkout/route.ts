import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUser, isPro } from '@/lib/auth'
import { publicEnv, serverEnv } from '@/lib/env'

/**
 * POST /api/stripe/checkout — start a Pro subscription.
 * Returns { url } for the Stripe-hosted checkout page.
 */
export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  if (await isPro(user.id)) {
    return NextResponse.json({ error: 'You are already on Pro.' }, { status: 409 })
  }

  const stripe = getStripe()
  const supabase = await createClient()
  const origin = publicEnv.hubUrl()

  // Reuse the Stripe customer if this user has subscribed before, so their
  // billing history stays on one record.
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let customerId = existing?.stripe_customer_id ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await createAdminClient()
      .from('subscriptions')
      .upsert(
        { user_id: user.id, stripe_customer_id: customerId, status: 'incomplete' },
        { onConflict: 'user_id' }
      )
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: serverEnv.stripeProPriceId(), quantity: 1 }],
    success_url: `${origin}/library?upgraded=1`,
    cancel_url: `${origin}/upgrade?canceled=1`,
    // Echoed back on the webhook so we can map the event to a hub user
    // without trusting anything the browser sends.
    client_reference_id: user.id,
    metadata: { supabase_user_id: user.id },
    subscription_data: { metadata: { supabase_user_id: user.id } },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 })
  }

  return NextResponse.json({ url: session.url })
}
