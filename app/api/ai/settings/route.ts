import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptKey } from '@/lib/ai/crypto'

export async function GET() {
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user)return NextResponse.json({authenticated:false,connected:false})
  const {data,error}=await db.from('ai_user_settings').select('user_id').eq('user_id',user.id).maybeSingle()
  if(error)return NextResponse.json({error:'AI settings unavailable. Apply the AI database migration.'},{status:503})
  return NextResponse.json({authenticated:true,connected:!!data})
}
export async function POST(request:Request) {
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null)
  const apiKey=body?.apiKey
  if(typeof apiKey!=='string'||!apiKey.startsWith('sk-')||apiKey.length>512||apiKey.length<20)return NextResponse.json({error:'Invalid OpenAI API key format'},{status:400})
  let encrypted:string
  try{encrypted=encryptKey(apiKey)}catch{return NextResponse.json({error:'AI encryption not configured'},{status:503})}
  const {error}=await db.from('ai_user_settings').upsert({user_id:user.id,api_key_encrypted:encrypted},{onConflict:'user_id'})
  if(error)return NextResponse.json({error:'Could not save key. Check AI database migration.'},{status:503})
  return NextResponse.json({connected:true})
}
export async function DELETE() {
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
  const {error}=await db.from('ai_user_settings').delete().eq('user_id',user.id)
  if(error)return NextResponse.json({error:'Could not disconnect'},{status:500})
  return NextResponse.json({connected:false})
}
