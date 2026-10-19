import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth'

type Store = { prospects:any[]; secondary:any[]; primary:any[] }

function toRows(store:Store,userId:string){
  const now=new Date().toISOString()
  return [
    ...(store.prospects??[]).map(row=>({user_id:userId,client_id:String(row.id),relationship_level:'prospect',name:String(row.name??''),company:String(row.company??''),phone:String(row.phone??''),email:String(row.email??''),production:row.production==null?null:Number(row.production),prospect_stage:Number(row.stage??0),secondary_group:null,primary_tier:null,birthday:'',partnership_tie:'',last_touch:'',notes:String(row.notes??''),call_notes:String(row.callNotes??''),updated_at:now})),
    ...(store.secondary??[]).map(row=>({user_id:userId,client_id:String(row.id),relationship_level:'secondary',name:String(row.name??''),company:String(row.company??''),phone:String(row.phone??''),email:String(row.email??''),production:row.count==null?null:Number(row.count),prospect_stage:null,secondary_group:['Bus','BU','Prog'].includes(row.group)?row.group:'BU',primary_tier:null,birthday:'',partnership_tie:'',last_touch:String(row.lastTouch??''),notes:String(row.notes??''),call_notes:String(row.callNotes??''),updated_at:now})),
    ...(store.primary??[]).map(row=>({user_id:userId,client_id:String(row.id),relationship_level:'primary',name:String(row.name??''),company:String(row.company??''),phone:String(row.phone??''),email:String(row.email??''),production:row.families==null?null:Number(row.families),prospect_stage:null,secondary_group:null,primary_tier:['A','B','C'].includes(row.tier)?row.tier:'C',birthday:String(row.birthday??''),partnership_tie:String(row.tie??''),last_touch:String(row.lastTouch??''),notes:String(row.notes??''),call_notes:String(row.callNotes??''),updated_at:now}))
  ]
}
function fromRows(rows:any[]):Store{
  const store:Store={prospects:[],secondary:[],primary:[]}
  for(const row of rows){
    if(row.relationship_level==='prospect')store.prospects.push({id:row.client_id,name:row.name??'',company:row.company??'',phone:row.phone??'',email:row.email??'',production:row.production==null?null:Number(row.production),notes:row.notes??'',callNotes:row.call_notes??'',stage:Number(row.prospect_stage??0)})
    else if(row.relationship_level==='secondary')store.secondary.push({id:row.client_id,group:row.secondary_group??'BU',name:row.name??'',company:row.company??'',phone:row.phone??'',email:row.email??'',count:row.production==null?null:Number(row.production),notes:row.notes??'',callNotes:row.call_notes??'',lastTouch:row.last_touch??'',nextAction:''})
    else if(row.relationship_level==='primary')store.primary.push({id:row.client_id,tier:row.primary_tier??'C',name:row.name??'',company:row.company??'',phone:row.phone??'',email:row.email??'',birthday:row.birthday??'',tie:row.partnership_tie??'',families:row.production==null?null:Number(row.production),notes:row.notes??'',callNotes:row.call_notes??'',lastTouch:row.last_touch??'',nextAction:''})
  }
  return store
}
export async function GET(){
  const user=await getUser()
  if(!user)return NextResponse.json({error:'Not signed in.'},{status:401})
  const supabase=await createClient()
  const {data,error}=await supabase.from('realtor_relationships').select('*').eq('user_id',user.id).order('created_at',{ascending:true})
  if(error)return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({store:fromRows(data??[])})
}
export async function PUT(request:Request){
  const user=await getUser()
  if(!user)return NextResponse.json({error:'Not signed in.'},{status:401})
  const body=await request.json().catch(()=>({}))
  const store=body?.store as Store|undefined
  if(!store||!Array.isArray(store.prospects)||!Array.isArray(store.secondary)||!Array.isArray(store.primary))return NextResponse.json({error:'Invalid store.'},{status:400})
  const supabase=await createClient()
  const rows=toRows(store,user.id)
  const ids=rows.map(r=>r.client_id)
  if(rows.length){
    const {error:upsertError}=await supabase.from('realtor_relationships').upsert(rows,{onConflict:'user_id,client_id'})
    if(upsertError)return NextResponse.json({error:upsertError.message},{status:500})
    const {data:existing,error:existingError}=await supabase.from('realtor_relationships').select('client_id').eq('user_id',user.id)
    if(existingError)return NextResponse.json({error:existingError.message},{status:500})
    const stale=(existing??[]).map(r=>r.client_id).filter(id=>!ids.includes(id))
    if(stale.length){
      const {error:deleteError}=await supabase.from('realtor_relationships').delete().eq('user_id',user.id).in('client_id',stale)
      if(deleteError)return NextResponse.json({error:deleteError.message},{status:500})
    }
  }else{
    const {error:deleteError}=await supabase.from('realtor_relationships').delete().eq('user_id',user.id)
    if(deleteError)return NextResponse.json({error:deleteError.message},{status:500})
  }
  return NextResponse.json({ok:true,count:rows.length})
}
