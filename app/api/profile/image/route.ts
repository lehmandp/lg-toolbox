import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 5 * 1024 * 1024
const allowed = { 'image/png':'png', 'image/jpeg':'jpg', 'image/webp':'webp' } as const

function isValidImage(bytes: Uint8Array, mime: string) {
  if (mime === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)
  if (mime === 'image/jpeg') return bytes.length >= 3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255
  if (mime === 'image/webp') return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP'
  return false
}

export async function POST(request: Request) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 })
  const form = await request.formData().catch(()=>null)
  const kind = form?.get('kind')
  const file = form?.get('file')
  if (kind !== 'logo' && kind !== 'headshot') return NextResponse.json({ error:'Invalid image type' }, { status:400 })
  if (!(file instanceof File) || !Object.prototype.hasOwnProperty.call(allowed,file.type) || file.size < 1 || file.size > MAX_BYTES) {
    return NextResponse.json({ error:'Use a PNG, JPEG, or WebP image under 5 MB' }, { status:400 })
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (!isValidImage(bytes,file.type)) return NextResponse.json({ error:'Image content does not match file type' }, { status:400 })
  const suffix = allowed[file.type as keyof typeof allowed]
  const path = `${user.id}/${kind}-${crypto.randomUUID()}.${suffix}`
  const { error:uploadError } = await db.storage.from('toolbox-branding').upload(path,bytes,{ contentType:file.type, upsert:false })
  if (uploadError) return NextResponse.json({ error:'Image upload failed' }, { status:503 })
  const { data:urlData } = db.storage.from('toolbox-branding').getPublicUrl(path)
  const key = kind === 'logo' ? 'logo_url' : 'headshot_url'
  const { error:saveError } = await db.from('toolbox_profiles').upsert({ user_id:user.id, [key]:urlData.publicUrl }, { onConflict:'user_id' })
  if (saveError) {
    await db.storage.from('toolbox-branding').remove([path])
    return NextResponse.json({ error:'Image profile update failed' }, { status:503 })
  }
  return NextResponse.json({ url:urlData.publicUrl, kind })
}
