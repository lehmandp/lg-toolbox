import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'
import { DEFAULT_SETTINGS } from '@/components/originator-engine/storage'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createClient()

  const { error: settingsError } = await supabase
    .from('originator_engine_settings')
    .upsert(
      {
        user_id: user.id,
        settings: DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  const { error: activityError } = await supabase
    .from('originator_engine_activity_entries')
    .delete()
    .eq('user_id', user.id)

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, settings: DEFAULT_SETTINGS })
}
