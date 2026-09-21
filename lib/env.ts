/**
 * Lazy, validated environment access.
 *
 * Deliberately NOT read at module scope: Next builds and prerenders without
 * secrets present, and a top-level throw would break `next build` in CI.
 * These throw at first use instead, where the message is actionable.
 */

function require_(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to .env.local for local dev, and to the Vercel project settings for deploys.`
    )
  }
  return value
}

/**
 * Safe to expose to the browser.
 *
 * Each NEXT_PUBLIC_* var MUST be written out as a literal
 * `process.env.NEXT_PUBLIC_FOO` here. Next inlines these into the client
 * bundle by static analysis, so a dynamic `process.env[name]` lookup is
 * never substituted and reads as undefined in the browser.
 */
export const publicEnv = {
  supabaseUrl: () =>
    require_('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),

  supabaseAnonKey: () =>
    require_('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),

  stripePublishableKey: () =>
    require_(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),

  /** Absolute origin of the hub, for Stripe redirects and auth callbacks. */
  hubUrl: () =>
    process.env.NEXT_PUBLIC_HUB_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
}

/**
 * Server-only. Never import into a client component.
 * Dynamic lookup is fine here — these are only read in Node.
 */
export const serverEnv = {
  supabaseServiceRoleKey: () =>
    require_('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY),

  /** Shared with Strike Price; signs the short-lived SSO handoff token. */
  hubSsoSecret: () => require_('HUB_SSO_SECRET', process.env.HUB_SSO_SECRET),

  stripeSecretKey: () => require_('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY),

  stripeWebhookSecret: () =>
    require_('STRIPE_WEBHOOK_SECRET', process.env.STRIPE_WEBHOOK_SECRET),

  stripeProPriceId: () => require_('STRIPE_PRO_PRICE_ID', process.env.STRIPE_PRO_PRICE_ID),
}
