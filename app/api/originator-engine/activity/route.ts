import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('originator_engine_activity_entries')
    .select('id, entry_type, activity_date, title, category, note, metrics, created_at')
    .eq('user_id', user.id)
    .order('activity_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const activity = (data ?? []).map((row) => ({
    id: row.id,
    type: row.entry_type,
    date: row.activity_date,
    createdAt: row.created_at,
    title: row.title ?? '',
    category: row.category ?? 'Other',
    note: row.note ?? '',
    face: Number(row.metrics?.face ?? 0),
    bread: Number(row.metrics?.bread ?? 0),
    calls: Number(row.metrics?.calls ?? 0),
    events: Number(row.metrics?.events ?? 0),
    content: Number(row.metrics?.content ?? 0),
    cards: Number(row.metrics?.cards ?? 0),
    gifts: Number(row.metrics?.gifts ?? 0),
    newRealtors: Number(row.metrics?.newRealtors ?? 0),
    newOffices: Number(row.metrics?.newOffices ?? 0),
    newVips: Number(row.metrics?.newVips ?? 0),
    leads: Number(row.metrics?.leads ?? 0),
    deals: Number(row.metrics?.deals ?? 0),
  }))

  return NextResponse.json({ activity })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const entryType = body.type === 'bulk' ? 'bulk' : 'individual'
  const activityDate = String(body.date ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate)) {
    return NextResponse.json({ error: 'A valid activity date is required.' }, { status: 400 })
  }

  const metrics = {
    face: Number(body.face ?? 0),
    bread: Number(body.bread ?? 0),
    calls: Number(body.calls ?? 0),
    events: Number(body.events ?? 0),
    content: Number(body.content ?? 0),
    cards: Number(body.cards ?? 0),
    gifts: Number(body.gifts ?? 0),
    newRealtors: Number(body.newRealtors ?? 0),
    newOffices: Number(body.newOffices ?? 0),
    newVips: Number(body.newVips ?? 0),
    leads: Number(body.leads ?? 0),
    deals: Number(body.deals ?? 0),
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('originator_engine_activity_entries')
    .insert({
      user_id: user.id,
      entry_type: entryType,
      activity_date: activityDate,
      title: String(body.title ?? '') || null,
      category: String(body.category ?? 'Other') || null,
      note: String(body.note ?? '') || null,
      metrics,
    })
    .select('id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    entry: {
      ...body,
      id: data.id,
      createdAt: data.created_at,
      type: entryType,
      date: activityDate,
    },
  }, { status: 201 })
}
