import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
const metrics=['face','bread','calls','events','content','cards','gifts','newRealtors','newOffices','newVips','leads','deals'] as const
export async function GET(){
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const monday=new Date();const offset=(monday.getUTCDay()+6)%7;monday.setUTCDate(monday.getUTCDate()-offset);monday.setUTCHours(0,0,0,0)
 const start=monday.toISOString().slice(0,10)
 const [activity,settings]=await Promise.all([
 db.from('originator_engine_activity_entries').select('activity_date,metrics').eq('user_id',user.id).gte('activity_date',start).limit(1000),
 db.from('originator_engine_settings').select('settings').eq('user_id',user.id).maybeSingle()
 ])
 if(activity.error||settings.error)return NextResponse.json({error:'Activity summary unavailable'},{status:500})
 const totals:Record<string,number>={}
 for(const key of metrics)totals[key]=0
 for(const row of activity.data??[])for(const key of metrics)totals[key]+=Number(row.metrics?.[key]??0)||0
 const raw=settings.data?.settings??{}
 const goals=Object.fromEntries(Object.entries(raw).filter(([k,v])=>/^weekly[A-Z]/.test(k)&&typeof v==='number'))
 return NextResponse.json({source:'Originator Engine',weekStarting:start,activityTotals:totals,weeklyGoals:goals,recordCount:(activity.data??[]).length})
}
