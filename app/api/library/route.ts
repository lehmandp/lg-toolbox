import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

/** GET /api/library — the caller's tools. */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('user_tools')
    .select('tool_id, added_at')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (rows ?? []).map((row) => row.tool_id)
  if (ids.length === 0) return NextResponse.json({ tools: [] })

  const { data: tools, error: toolError } = await createAdminClient()
    .from('tools')
    .select('*')
    .in('id', ids)

  if (toolError) return NextResponse.json({ error: toolError.message }, { status: 500 })

  const byId = new Map((tools ?? []).map((tool) => [tool.id, tool]))
  return NextResponse.json({ tools: ids.map((id) => byId.get(id)).filter(Boolean) })
}

/** POST /api/library — add any published tool, free or paid. Body: { toolId } */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { toolId } = await request.json().catch(() => ({}))
  if (!toolId) return NextResponse.json({ error: 'toolId is required.' }, { status: 400 })

  const supabase = await createClient()
  const { data: tool, error: toolError } = await createAdminClient()
    .from('tools')
    .select('id, published')
    .eq('id', toolId)
    .maybeSingle()

  if (toolError) return NextResponse.json({ error: toolError.message }, { status: 500 })
  if (!tool || !tool.published) {
    return NextResponse.json({ error: 'That tool is not available.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('user_tools')
    .upsert({ user_id: user.id, tool_id: tool.id }, { onConflict: 'user_id,tool_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/** DELETE /api/library — remove a tool. Body: { toolId } */
export async function DELETE(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { toolId } = await request.json().catch(() => ({}))
  if (!toolId) return NextResponse.json({ error: 'toolId is required.' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('user_tools')
    .delete()
    .eq('user_id', user.id)
    .eq('tool_id', toolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
