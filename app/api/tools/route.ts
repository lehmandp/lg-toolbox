import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUser, isAdmin } from '@/lib/auth'
import { requireAdmin, toolPayload } from '@/lib/admin-guard'

/**
 * GET /api/tools — published tools. Admins additionally see drafts.
 */
export async function GET() {
  const supabase = await createClient()
  const user = await getUser()
  const admin = user ? await isAdmin(user.id) : false

  const query = supabase.from('tools').select('*').order('created_at', { ascending: false })
  const { data, error } = admin ? await query : await query.eq('published', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tools: data ?? [] })
}

/** POST /api/tools — create a tool. Admins only. */
export async function POST(request: Request) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  const body = await request.json().catch(() => ({}))
  const payload = toolPayload(body)

  if (!payload.name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (Number.isNaN(payload.monthly_price) || payload.monthly_price < 0) {
    return NextResponse.json({ error: 'Monthly price must be 0 or more.' }, { status: 400 })
  }

  const { data, error } = await createAdminClient()
    .from('tools')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tool: data }, { status: 201 })
}
