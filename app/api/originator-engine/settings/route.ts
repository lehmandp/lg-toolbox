import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('originator_engine_settings')
    .select('settings')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ settings: data?.settings ?? null })
}

export async function PUT(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { settings } = await request.json().catch(() => ({}))
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'settings is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('originator_engine_settings')
    .upsert(
      { user_id: user.id, settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
