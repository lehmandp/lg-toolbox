import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import { createClient } from '@/lib/supabase/server'
import { getUser, isPro } from '@/lib/auth'
import { serverEnv } from '@/lib/env'
import { isProTool, toolSlug } from '@/lib/types'

/** Handoff tokens are single-use in practice; keep the window tight. */
const TOKEN_TTL_SECONDS = 5 * 60

/**
 * POST /api/sso/generate-token — mint a short-lived handoff token for a
 * Pro tool. Body: { toolId }. Returns { url } to open.
 *
 * Every precondition is re-checked here rather than trusted from the client:
 * signed in, tool published, tool in the caller's library, and Pro active.
 */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { toolId } = await request.json().catch(() => ({}))
  if (!toolId) return NextResponse.json({ error: 'toolId is required.' }, { status: 400 })

  const supabase = await createClient()

  const { data: tool, error } = await supabase
    .from('tools')
    .select('id, name, monthly_price, tool_url, published')
    .eq('id', toolId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!tool || !tool.published) {
    return NextResponse.json({ error: 'That tool is not available.' }, { status: 404 })
  }
  if (!tool.tool_url) {
    return NextResponse.json({ error: 'This tool has no launch URL yet.' }, { status: 409 })
  }

  const { data: owned } = await supabase
    .from('user_tools')
    .select('tool_id')
    .eq('user_id', user.id)
    .eq('tool_id', tool.id)
    .maybeSingle()

  if (!owned) {
    return NextResponse.json({ error: 'Add this tool to your library first.' }, { status: 403 })
  }

  if (isProTool(tool) && !(await isPro(user.id))) {
    return NextResponse.json(
      { error: 'This tool requires an active Pro subscription.' },
      { status: 402 }
    )
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? ''

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name,
      subscription: 'pro',
      tool: toolSlug(tool.name),
      iss: 'lg-toolbox-hub',
      jti: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    },
    serverEnv.hubSsoSecret()
  )

  // tool_url is the tool's SSO entry point, e.g. https://strikeprice.com/sso
  const url = new URL(tool.tool_url)
  url.searchParams.set('token', token)

  return NextResponse.json({ url: url.toString() })
}
