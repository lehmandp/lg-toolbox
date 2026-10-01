import 'server-only'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/auth'
import type { ToolType } from '@/lib/types'

type Guarded = { user: User } | { response: NextResponse }

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

export function toolPayload(body: Record<string, unknown>) {
  const toolType: ToolType = body.tool_type === 'external' ? 'external' : 'native'
  return {
    name: String(body.name ?? '').trim(),
    description: (body.description as string | null) ?? null,
    category: (body.category as string | null) ?? null,
    monthly_price: Number(body.monthly_price ?? 0),
    tool_url: (body.tool_url as string | null) ?? null,
    repository_url: (body.repository_url as string | null) ?? null,
    published: Boolean(body.published),
    tool_type: toolType,
    display_order: Number(body.display_order ?? 100),
    featured: Boolean(body.featured),
  }
}
