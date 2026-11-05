import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const fields = ['full_name','company','nmls','company_nmls','phone','email','website','business_address','license_state','license_number','tagline','disclosure'] as const
const branding = ['logo','headshot','both','none'] as const
const selection = [...fields,'logo_url','headshot_url','branding_default'].join(',')

export async function GET() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await db.from('toolbox_profiles').select(selection).eq('user_id',user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Profile unavailable' }, { status: 503 })
  return NextResponse.json({ profile: data })
}

export async function PUT(req: Request) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  const clean: Record<string,string> = {}
  for (const key of fields) {
    const value = body[key]
    if (typeof value !== 'string' || value.length > (key === 'disclosure' ? 2000 : 300)) {
      return NextResponse.json({ error: 'Invalid ' + key }, { status: 400 })
    }
    clean[key] = value.trim()
  }
  if (!branding.includes(body.branding_default)) return NextResponse.json({ error: 'Invalid branding preference' }, { status: 400 })
  const { error } = await db.from('toolbox_profiles').upsert({ user_id:user.id, ...clean, branding_default:body.branding_default }, { onConflict:'user_id' })
  if (error) return NextResponse.json({ error: 'Could not save profile' }, { status: 503 })
  return NextResponse.json({ saved:true })
}
