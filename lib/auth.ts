import 'server-only'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const OWNER_ADMIN_EMAIL = 'daniel@lehmangrp.com'

/** The signed-in user, or null. Verified against Supabase, not just the cookie. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** True when the user has a row in admin_users. */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data !== null
}

/**
 * True when the user has a Pro plan that is active AND not past its period end.
 */
export async function isPro(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data || data.status !== 'active') return false
  if (!data.current_period_end) return true
  return new Date(data.current_period_end).getTime() > Date.now()
}

export interface Viewer {
  user: User
  isAdmin: boolean
  isPro: boolean
}

/** Resolves the full viewer context in one pass. Returns null if signed out. */
export async function getViewer(): Promise<Viewer | null> {
  const user = await getUser()
  if (!user) return null

  const ownerAdmin = user.email?.toLowerCase() === OWNER_ADMIN_EMAIL
  const [adminRow, pro] = await Promise.all([
    ownerAdmin ? Promise.resolve(true) : isAdmin(user.id),
    isPro(user.id),
  ])

  return { user, isAdmin: ownerAdmin || adminRow, isPro: pro }
}
