import 'server-only'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/auth'

type Guarded = { user: User } | { response: NextResponse }

/**
 * Verifies the caller is a signed-in admin.
 *
 * Admin writes then go through the service-role client, so they do not depend
 * on how the `tools` RLS policies happen to be written. Authorisation is
 * decided here, in application code, before any privileged client is used.
 */
export async function requireAdmin(): Promise<Guarded> {
  const user = await getUser()
  if (!user) {
    return { response: NextResponse.json({ error: 'Not signed in.' }, { status: 401 }) }
  }
  if (!(await isAdmin(user.id))) {
    return { response: NextResponse.json({ error: 'Admins only.' }, { status: 403 }) }
  }
  return { user }
}

/** Whitelist of writable columns, so a client cannot set id/created_at. */
export function toolPayload(body: Record<string, unknown>) {
  return {
    name: String(body.name ?? '').trim(),
    description: (body.description as string | null) ?? null,
    category: (body.category as string | null) ?? null,
    monthly_price: Number(body.monthly_price ?? 0),
    tool_url: (body.tool_url as string | null) ?? null,
    repository_url: (body.repository_url as string | null) ?? null,
    published: Boolean(body.published),
  }
}
