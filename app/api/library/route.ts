import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser, isPro } from '@/lib/auth'
import { isProTool } from '@/lib/types'

/** GET /api/library — the caller's tools. */
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_tools')
    .select('added_at, tools(*)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tools: data?.map((row) => row.tools) ?? [] })
}

/** POST /api/library — add a tool. Body: { toolId } */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { toolId } = await request.json().catch(() => ({}))
  if (!toolId) return NextResponse.json({ error: 'toolId is required.' }, { status: 400 })

  const supabase = await createClient()
  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .select('id, name, monthly_price, published')
    .eq('id', toolId)
    .maybeSingle()

  if (toolError) return NextResponse.json({ error: toolError.message }, { status: 500 })
  if (!tool || !tool.published) {
    return NextResponse.json({ error: 'That tool is not available.' }, { status: 404 })
  }

  // Enforce the paywall on the server. The UI hides locked tools, but the
  // endpoint must not rely on that.
  if (isProTool(tool) && !(await isPro(user.id))) {
    return NextResponse.json(
      { error: 'This tool requires an active Pro subscription.' },
      { status: 402 }
    )
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
