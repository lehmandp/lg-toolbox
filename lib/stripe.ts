import 'server-only'
import Stripe from 'stripe'
import { serverEnv } from '@/lib/env'

let cached: Stripe | null = null

/**
 * Lazily constructed so that importing this module during `next build`
 * does not require STRIPE_SECRET_KEY to be present.
 */
export function getStripe(): Stripe {
  if (!cached) {
    cached = new Stripe(serverEnv.stripeSecretKey(), { typescript: true })
  }
  return cached
}

export const PRO_PLAN = {
  name: 'LG Toolbox Pro',
  priceLabel: '$100',
  interval: 'month',
} as const
