import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

type Row = Record<string,unknown>
const allowedLevels=['prospect','secondary','primary']
function asText(v:unknown,max=1200){return typeof v==='string'?v.slice(0,max):''}
function asInt(v:unknown){return typeof v==='number'&&Number.isFinite(v)?Math.round(v):null}
function normalize(row:Row){
 const level=asText(row.relationship_level,20)
 const clientId=asText(row.client_id,100)
 const name=asText(row.name,200).trim()
 if(!allowedLevels.includes(level)||!clientId||!name)throw Error('Invalid relationship')
 return {client_id:clientId,relationship_level:level,name,
 company:asText(row.company,200),phone:asText(row.phone,100),email:asText(row.email,200),
 production:asInt(row.production),prospect_stage:asInt(row.prospect_stage),
 secondary_group:asText(row.secondary_group,20)||null,primary_tier:asText(row.primary_tier,20)||null,
 birthday:asText(row.birthday,100),partnership_tie:asText(row.partnership_tie,200),
 last_touch:asText(row.last_touch,100),notes:asText(row.notes,5000),next_action:asText(row.next_action,1000)}
}
export async function GET(){
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data,error}=await db.from('realtor_relationships').select('client_id,relationship_level,name,company,phone,email,production,prospect_stage,secondary_group,primary_tier,birthday,partnership_tie,last_touch,notes,next_action,updated_at').eq('user_id',user.id).order('name').limit(2000)
 if(error)return NextResponse.json({error:'Unable to load Realtor records'},{status:500})
 return NextResponse.json({rows:data??[]},{headers:{'Cache-Control':'no-store'}})
}
// Save one user-owned record only. Never delete or overwrite unrelated records.
export async function PUT(request:Request){
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await request.json().catch(()=>null)
 if(!body||typeof body!=='object'||Array.isArray(body))return NextResponse.json({error:'Invalid record'},{status:400})
 let row:ReturnType<typeof normalize>
 try{row=normalize(body)}catch{return NextResponse.json({error:'Invalid record'},{status:400})}
 const {data:existing,error:lookupError}=await db.from('realtor_relationships').select('id,updated_at').eq('user_id',user.id).eq('client_id',row.client_id).maybeSingle()
 if(lookupError)return NextResponse.json({error:'Could not verify existing record'},{status:500})
 // Explicit version check: other-browser changes cannot be silently overwritten.
 if(existing){
   if(typeof body.expectedUpdatedAt!=='string'||body.expectedUpdatedAt!==existing.updated_at)return NextResponse.json({error:'Record has changed on another device. Refresh before saving.',conflict:true},{status:409})
   const changes={...row,updated_at:new Date().toISOString()}
   // Do not erase legacy fields that the Toolbox interface does not edit.
   if(row.relationship_level!=='prospect')delete (changes as Record<string,unknown>).company
   if(row.relationship_level==='primary')delete (changes as Record<string,unknown>).notes
   const {data,error}=await db.from('realtor_relationships').update(changes).eq('id',existing.id).eq('user_id',user.id).eq('updated_at',existing.updated_at).select('updated_at').maybeSingle()
   if(error||!data)return NextResponse.json({error:'Could not save; refresh and retry'},{status:409})
   return NextResponse.json({updated_at:data.updated_at})
 }
 const {data,error}=await db.from('realtor_relationships').insert({...row,user_id:user.id}).select('updated_at').single()
 if(error)return NextResponse.json({error:'Could not create record; refresh before retrying'},{status:409})
 return NextResponse.json({updated_at:data.updated_at},{status:201})
}
// Import missing browser records only. Existing cloud records are never modified.
export async function POST(request:Request){
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const body=await request.json().catch(()=>null)
 if(!body||body.confirmMissingOnly!==true||!Array.isArray(body.rows)||body.rows.length>500)return NextResponse.json({error:'Explicit import confirmation required'},{status:400})
 let rows:ReturnType<typeof normalize>[]
 try{rows=body.rows.map((x:unknown)=>normalize(x as Row))}catch{return NextResponse.json({error:'Invalid import data'},{status:400})}
 const {data:existing,error:lookupError}=await db.from('realtor_relationships').select('client_id').eq('user_id',user.id).limit(2000)
 if(lookupError)return NextResponse.json({error:'Could not verify cloud records'},{status:500})
 const seen=new Set((existing??[]).map(x=>x.client_id))
 const missing=rows.filter(x=>{if(seen.has(x.client_id))return false;seen.add(x.client_id);return true})
 if(!missing.length)return NextResponse.json({imported:0,skipped:rows.length})
 const {error}=await db.from('realtor_relationships').insert(missing.map(x=>({...x,user_id:user.id})))
 if(error)return NextResponse.json({error:'Import could not be completed; refresh to review records'},{status:409})
 return NextResponse.json({imported:missing.length,skipped:rows.length-missing.length})
}
