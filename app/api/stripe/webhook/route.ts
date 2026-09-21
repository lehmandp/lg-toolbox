import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'
import type { SubscriptionStatus } from '@/lib/types'

/** Stripe signs the raw body, so this route must never parse it as JSON first. */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'paused':
      return 'canceled'
    default:
      return 'incomplete'
  }
}

/** The subscription's period end lives on its first item in current Stripe APIs. */
function periodEnd(subscription: Stripe.Subscription): string | null {
  const seconds =
    subscription.items?.data?.[0]?.current_period_end ??
    (subscription as unknown as { current_period_end?: number }).current_period_end
  return seconds ? new Date(seconds * 1000).toISOString() : null
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = createAdminClient()
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  // Prefer the metadata we set at checkout; fall back to the customer id so
  // subscriptions created in the Stripe dashboard still resolve.
  let userId = subscription.metadata?.supabase_user_id ?? null

  if (!userId) {
    const { data } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    userId = data?.user_id ?? null
  }

  if (!userId) {
    console.error('[stripe] no hub user for customer', customerId)
    return
  }

  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: mapStatus(subscription.status),
      current_period_end: periodEnd(subscription),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (error) console.error('[stripe] failed to sync subscription', error.message)
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  const stripe = getStripe()
  const raw = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, signature, serverEnv.stripeWebhookSecret())
  } catch (e) {
    // A bad signature means the caller is not Stripe. Do not process it.
    const message = e instanceof Error ? e.message : 'Invalid signature.'
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const id =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(id)
          // Carry the hub user id through in case it was only on the session.
          if (!subscription.metadata?.supabase_user_id && session.client_reference_id) {
            subscription.metadata = {
              ...subscription.metadata,
              supabase_user_id: session.client_reference_id,
            }
          }
          await syncSubscription(subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break

      default:
        // Unhandled types are acknowledged so Stripe stops retrying them.
        break
    }
  } catch (e) {
    console.error('[stripe] handler error', e)
    // 500 tells Stripe to retry, which is what we want for a transient fault.
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
