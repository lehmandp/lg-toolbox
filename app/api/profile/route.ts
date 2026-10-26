import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
const keys=['full_name','company','nmls','company_nmls','phone','website'] as const
export async function GET(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data,error}=await db.from('toolbox_profiles').select(keys.join(',')).eq('user_id',user.id).maybeSingle()
 if(error)return NextResponse.json({error:'Profile table not configured'},{status:503})
 return NextResponse.json({profile:data})
}
export async function PUT(req:Request){
 const db=await createClient();const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await req.json().catch(()=>null)
 if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid input'},{status:400})
 const clean:Record<string,string>={}
 for(const k of keys){const v=body[k];if(typeof v!=='string'||v.length>200)return NextResponse.json({error:'Invalid '+k},{status:400});clean[k]=v.trim()}
 const {error}=await db.from('toolbox_profiles').upsert({user_id:user.id,...clean},{onConflict:'user_id'})
 if(error)return NextResponse.json({error:'Profile could not be saved; check database setup'},{status:503})
 return NextResponse.json({saved:true})
}
