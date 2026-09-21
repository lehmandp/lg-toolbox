import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { serverEnv } from '@/lib/env'

/**
 * POST /api/validate-subscription — server-to-server check used by Strike
 * Price middleware to answer "does this email have an active hub Pro plan?".
 *
 * This endpoint is NOT public: it reports subscription status for an
 * arbitrary email, so it requires the shared secret as a bearer token.
 * Call it only from a trusted backend, never from a browser.
 *
 * Body: { email }  ->  { pro: boolean, current_period_end: string | null }
 */
export async function POST(request: Request) {
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expected = serverEnv.hubSsoSecret()

  // Constant-time compare, and length-guarded because timingSafeEqual throws
  // on a length mismatch.
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { email } = await request.json().catch(() => ({}))
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email is required.' }, { status: 400 })
  }

  /*
   * auth.users is not exposed over PostgREST, so the email -> subscription
   * lookup goes through a SECURITY DEFINER function. See supabase/schema.sql
   * (hub_pro_status), which is execute-revoked from anon and authenticated.
   */
  const { data, error } = await createAdminClient().rpc('hub_pro_status', {
    p_email: email.toLowerCase(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const row = Array.isArray(data) ? data[0] : data

  return NextResponse.json({
    pro: Boolean(row?.pro),
    current_period_end: row?.current_period_end ?? null,
  })
}
