import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { publicEnv, serverEnv } from '@/lib/env'

/**
 * Supabase client for server components, route handlers and server actions.
 * Reads the caller's session from cookies, so RLS applies as that user.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  })
}

/**
 * Service-role client. BYPASSES ROW LEVEL SECURITY.
 *
 * Only for trusted server-side work that legitimately needs to act outside
 * a user's own rows — Stripe webhooks, admin writes. Never derive the acting
 * user from client input when using this; always verify the session first.
 */
export function createAdminClient() {
  return createSupabaseClient(publicEnv.supabaseUrl(), serverEnv.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
