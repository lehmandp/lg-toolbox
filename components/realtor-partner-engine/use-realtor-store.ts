'use client'
import {useEffect,useRef,useState} from 'react'

export type Prospect={id:string;name:string;company:string;phone:string;email:string;production:number|null;notes:string;stage:number}
export type Secondary={id:string;group:'Bus'|'BU'|'Prog';name:string;phone:string;email:string;count:number|null;notes:string;lastTouch:string;nextAction:string}
export type Primary={id:string;tier:'A'|'B'|'C';name:string;phone:string;email:string;birthday:string;tie:string;families:number|null;lastTouch:string;nextAction:string}
export type Store={prospects:Prospect[];secondary:Secondary[];primary:Primary[]}
type CloudRow={client_id:string;relationship_level:string;name:string;company:string;phone:string;email:string;production:number|null;prospect_stage:number|null;secondary_group:string|null;primary_tier:string|null;birthday:string;partnership_tie:string;last_touch:string;notes:string;next_action:string;updated_at?:string}
type Mode='loading'|'cloud'|'conflict'|'local-import'|'offline'
const KEY='lg_realtor_partner_engine_v1'
const SOURCE=KEY+'_data_source'
const UNSYNCED=KEY+'_unsynced'
const EMPTY:Store={prospects:[],secondary:[],primary:[]}
function rowsFromStore(store:Store):CloudRow[]{
 return [
 ...store.prospects.map(x=>({client_id:x.id,relationship_level:'prospect',name:x.name,company:x.company,phone:x.phone,email:x.email,production:x.production,prospect_stage:x.stage,secondary_group:null,primary_tier:null,birthday:'',partnership_tie:'',last_touch:'',notes:x.notes,next_action:''})),
 ...store.secondary.map(x=>({client_id:x.id,relationship_level:'secondary',name:x.name,company:'',phone:x.phone,email:x.email,production:x.count,prospect_stage:null,secondary_group:x.group,primary_tier:null,birthday:'',partnership_tie:'',last_touch:x.lastTouch,notes:x.notes,next_action:x.nextAction})),
 ...store.primary.map(x=>({client_id:x.id,relationship_level:'primary',name:x.name,company:'',phone:x.phone,email:x.email,production:x.families,prospect_stage:null,secondary_group:null,primary_tier:x.tier,birthday:x.birthday,partnership_tie:x.tie,last_touch:x.lastTouch,notes:'',next_action:x.nextAction}))
 ]
}
function fromRows(rows:CloudRow[]):Store{
 return {
 prospects:rows.filter(x=>x.relationship_level==='prospect').map(x=>({id:x.client_id,name:x.name,company:x.company||'',phone:x.phone||'',email:x.email||'',production:x.production,notes:x.notes||'',stage:x.prospect_stage??0})),
 secondary:rows.filter(x=>x.relationship_level==='secondary').map(x=>({id:x.client_id,name:x.name,phone:x.phone||'',email:x.email||'',count:x.production,notes:x.notes||'',lastTouch:x.last_touch||'',nextAction:x.next_action||'',group:(['Bus','BU','Prog'].includes(x.secondary_group||'')?x.secondary_group:'Prog') as Secondary['group']})),
 primary:rows.filter(x=>x.relationship_level==='primary').map(x=>({id:x.client_id,name:x.name,phone:x.phone||'',email:x.email||'',birthday:x.birthday||'',tie:x.partnership_tie||'',families:x.production,lastTouch:x.last_touch||'',nextAction:x.next_action||'',tier:(['A','B','C'].includes(x.primary_tier||'')?x.primary_tier:'C') as Primary['tier']}))
 }
}
function count(s:Store){return s.prospects.length+s.secondary.length+s.primary.length}
function readLocal():Store{
 try{const raw=localStorage.getItem(UNSYNCED)||localStorage.getItem(KEY);const x=raw?JSON.parse(raw):EMPTY
  if(Array.isArray(x.prospects)&&Array.isArray(x.secondary)&&Array.isArray(x.primary))return x
 }catch{}return EMPTY
}
async function loadRows():Promise<CloudRow[]>{
 const r=await fetch('/api/realtor-partner-engine/records',{cache:'no-store'})
 const d=await r.json()
 if(!r.ok)throw Error(d.error||'Unable to load cloud records')
 return d.rows||[]
}
export function useRealtorStore(){
 const [data,setData]=useState<Store>(EMPTY)
 const [loaded,setLoaded]=useState(false)
 const [mode,setMode]=useState<Mode>('loading')
 const [error,setError]=useState('')
 const [cloudCount,setCloudCount]=useState(0)
 const cloudRef=useRef<Store>(EMPTY)
 const revisions=useRef(new Map<string,string>())
 const saved=useRef(new Map<string,string>())
 const saveQueue=useRef<Promise<void>>(Promise.resolve())
 const modeRef=useRef<Mode>('loading')
 const latestDataRef=useRef<Store>(EMPTY)
 useEffect(()=>{modeRef.current=mode},[mode])
 useEffect(()=>{latestDataRef.current=data},[data])
 async function refreshCloud(){
  const rows=await loadRows()
  const store=fromRows(rows)
  cloudRef.current=store
  setCloudCount(rows.length)
  revisions.current=new Map(rows.map(r=>[r.client_id,r.updated_at||'']))
  saved.current=new Map(rowsFromStore(store).map(r=>[r.client_id,JSON.stringify(r)]))
  return store
 }
 useEffect(()=>{
  let canceled=false
  const local=readLocal()
  setData(local);setLoaded(true)
  void refreshCloud().then(cloud=>{
   if(canceled)return
   const preferCloud=localStorage.getItem(SOURCE)==='cloud'&&!localStorage.getItem(UNSYNCED)
   if(preferCloud||count(local)===0){setData(cloud);setMode('cloud')}
   else if(count(cloud)>0)setMode('conflict')
   else setMode('local-import')
  }).catch(()=>{if(!canceled){setMode('offline');setError('Cloud records unavailable. Browser data is unchanged; do not clear browser data.')}})
  return()=>{canceled=true}
 },[])
 useEffect(()=>{
  if(!loaded||mode==='loading'||mode==='cloud')return
  try{localStorage.setItem(KEY,JSON.stringify(data))}catch{setError('Browser backup could not be saved. Export immediately.')}
 },[data,loaded,mode])
 useEffect(()=>{
  if(!loaded||mode!=='cloud')return
  const next=rowsFromStore(data)
  const pending=next.filter(x=>saved.current.get(x.client_id)!==JSON.stringify(x))
  if(!pending.length)return
  try{localStorage.setItem(UNSYNCED,JSON.stringify(data))}catch{setError('Unable to safeguard pending edits. Export your data.');return}
  const timer=setTimeout(()=>{
   saveQueue.current=saveQueue.current.then(async()=>{
    for(const record of pending){
     if(modeRef.current!=='cloud')return
     if(saved.current.get(record.client_id)===JSON.stringify(record))continue
     const expectedUpdatedAt=revisions.current.get(record.client_id)
     const r=await fetch('/api/realtor-partner-engine/records',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...record,expectedUpdatedAt})})
     const result=await r.json()
     if(!r.ok)throw Error(result.error||'Save failed')
     revisions.current.set(record.client_id,result.updated_at)
     saved.current.set(record.client_id,JSON.stringify(record))
    }
    if(modeRef.current==='cloud'){
     // Do not discard a later edit that arrived while this snapshot was saving.
     const unsaved=rowsFromStore(latestDataRef.current).some(r=>saved.current.get(r.client_id)!==JSON.stringify(r))
     if(!unsaved)localStorage.removeItem(UNSYNCED)
    }
   }).catch(e=>{setError((e instanceof Error?e.message:'Cloud save failed')+' Your unsynced draft remains in this browser.');setMode('offline')})
  },650)
  return()=>clearTimeout(timer)
 },[data,loaded,mode])
 function exportData(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='realtor-partner-engine-backup.json';a.click();URL.revokeObjectURL(url)
 }
 function useCloud(){
  // Cloud wins only when the user chooses it; browser backup is retained unchanged.
  localStorage.setItem(SOURCE,'cloud')
  localStorage.removeItem(UNSYNCED)
  setData(cloudRef.current);setError('');setMode('cloud')
 }
 async function importMissing(){
  exportData()
  if(!window.confirm('A browser backup was downloaded. Import only browser records with IDs missing from Supabase? Matching IDs will NOT overwrite cloud records.'))return
  try{
   const r=await fetch('/api/realtor-partner-engine/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmMissingOnly:true,rows:rowsFromStore(data)})})
   const result=await r.json()
   if(!r.ok)throw Error(result.error||'Import failed')
   const cloud=await refreshCloud()
   localStorage.setItem(SOURCE,'cloud');localStorage.removeItem(UNSYNCED)
   setData(cloud);setMode('cloud')
   setError('Imported '+result.imported+' missing records. '+result.skipped+' matching IDs were left unchanged. Check both copies before deleting any backups.')
  }catch(e){setError(e instanceof Error?e.message:'Import failed')}
 }
 return {data,setData,loaded,mode,error,cloudCount,exportData,useCloud,importMissing}
}
