import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin, toolPayload } from '@/lib/admin-guard'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/tools/:id — update a tool. Admins only. */
export async function PATCH(request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  const { id } = await params
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
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tool: data })
}

/** DELETE /api/tools/:id — remove a tool. Admins only. */
export async function DELETE(_request: Request, { params }: Params) {
  const guard = await requireAdmin()
  if ('response' in guard) return guard.response

  const { id } = await params
  const { error } = await createAdminClient().from('tools').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
