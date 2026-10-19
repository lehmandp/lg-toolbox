'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'

type View = 'dashboard' | 'prospects' | 'secondary' | 'primary' | 'process'
type ModalType = 'prospect' | 'secondary' | 'primary'
type Prospect = { id:string; name:string; company:string; phone:string; email:string; production:number|null; notes:string; callNotes:string; stage:number }
type Secondary = { id:string; group:'Bus'|'BU'|'Prog'; name:string; company:string; phone:string; email:string; count:number|null; notes:string; callNotes:string; lastTouch:string; nextAction:string }
type Primary = { id:string; tier:'A'|'B'|'C'; name:string; company:string; phone:string; email:string; birthday:string; tie:string; families:number|null; notes:string; callNotes:string; lastTouch:string; nextAction:string }
type Store = { prospects:Prospect[]; secondary:Secondary[]; primary:Primary[] }
type EditRecord = { type:ModalType; id:string }

const KEY = 'lg_realtor_partner_engine_v1'
const EMPTY: Store = { prospects:[], secondary:[], primary:[] }
const input = 'rounded-[10px] border border-[#d8dee8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f4b7a]'
const mini = 'rounded-[9px] border border-[#d8dee8] bg-white px-3 py-2 text-xs font-extrabold'
const miniPrimary = 'rounded-[9px] border border-[#1f4b7a] bg-[#1f4b7a] px-3 py-2 text-xs font-extrabold text-white'
const list = 'mt-3 list-disc space-y-2 pl-5 text-sm'

function newId(){ return String(Date.now()) + '-' + Math.random().toString(36).slice(2,8) }
function stageLabel(stage:number){ return ['Not started','Initial contact','Meeting'][stage] ?? 'Not started' }
function todayKey(){ return new Date().toISOString().slice(0,10) }
function prettyTouchDate(value:string){
  if(!value)return '—'
  const d=new Date(value+'T12:00:00')
  return Number.isNaN(d.getTime())?value:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
}
function csvCell(value:unknown){
  const text=String(value??'')
  return '"'+text.replace(/"/g,'""')+'"'
}
function htmlEscape(value:unknown){
  return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]||ch))
}
function parseCsv(text:string){
  const rows:string[][]=[]
  let row:string[]=[],field='',quoted=false
  for(let i=0;i<text.length;i++){
    const ch=text[i]
    if(quoted){
      if(ch==='"'&&text[i+1]==='"'){field+='"';i++}
      else if(ch==='"'){quoted=false}
      else field+=ch
    }else{
      if(ch==='"')quoted=true
      else if(ch===','){row.push(field);field=''}
      else if(ch==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}
      else field+=ch
    }
  }
  row.push(field.replace(/\r$/,''))
  if(row.some(x=>x.trim()))rows.push(row)
  return rows
}
function normalizeHeader(value:string){return value.trim().toLowerCase().replace(/[^a-z0-9]/g,'')}


export default function RealtorPartnerEngine() {
  const [view,setView] = useState<View>('dashboard')
  const [data,setData] = useState<Store>(EMPTY)
  const [loaded,setLoaded] = useState(false)
  const [modal,setModal] = useState<ModalType|null>(null)
  const [editing,setEditing] = useState<EditRecord|null>(null)
  const [prospectSearch,setProspectSearch] = useState('')
  const [prospectStage,setProspectStage] = useState('all')
  const [secondarySearch,setSecondarySearch] = useState('')
  const [secondaryGroup,setSecondaryGroup] = useState('all')
  const [primarySearch,setPrimarySearch] = useState('')
  const [primaryTier,setPrimaryTier] = useState('all')

  useEffect(()=>{
    try {
      const saved = window.localStorage.getItem(KEY)
      if (saved) setData(JSON.parse(saved) as Store)
    } catch {}
    setLoaded(true)
  },[])

  useEffect(()=>{
    if (!loaded) return
    window.localStorage.setItem(KEY, JSON.stringify(data))
  },[data,loaded])

  const activeTouches = data.prospects.filter(x=>x.stage>0).length
  const relationshipPotential = ((data.secondary.length + data.primary.length) * 0.1875).toFixed(1)

  const shownProspects = useMemo(()=>data.prospects.filter(a=>{
    const q=prospectSearch.toLowerCase()
    return (!q || (a.name+' '+a.company+' '+a.notes+' '+(a.callNotes||'')+' '+a.email).toLowerCase().includes(q))
      && (prospectStage==='all' || String(a.stage)===prospectStage)
  }),[data.prospects,prospectSearch,prospectStage])

  const shownSecondary = useMemo(()=>data.secondary.filter(a=>{
    const q=secondarySearch.toLowerCase()
    return (!q || (a.name+' '+a.group+' '+a.notes+' '+(a.callNotes||'')+' '+a.email).toLowerCase().includes(q))
      && (secondaryGroup==='all' || a.group===secondaryGroup)
  }),[data.secondary,secondarySearch,secondaryGroup])

  const shownPrimary = useMemo(()=>data.primary.filter(a=>{
    const q=primarySearch.toLowerCase()
    return (!q || (a.name+' '+a.tier+' '+a.tie+' '+(a.notes||'')+' '+(a.callNotes||'')+' '+a.email).toLowerCase().includes(q))
      && (primaryTier==='all' || a.tier===primaryTier)
  }),[data.primary,primarySearch,primaryTier])

  function setStage(id:string,stage:number){
    setData(d=>({...d,prospects:d.prospects.map(p=>p.id===id?{...p,stage}:p)}))
  }

  function updateProspect(id:string,patch:Partial<Prospect>){
    setData(d=>({...d,prospects:d.prospects.map(p=>p.id===id?{...p,...patch}:p)}))
  }

  function updateSecondary(id:string,patch:Partial<Secondary>){
    setData(d=>({...d,secondary:d.secondary.map(p=>p.id===id?{...p,...patch}:p)}))
  }

  function updatePrimary(id:string,patch:Partial<Primary>){
    setData(d=>({...d,primary:d.primary.map(p=>p.id===id?{...p,...patch}:p)}))
  }
  function deleteAgent(type:ModalType,id:string){
    setData(d=>type==='prospect'
      ? {...d,prospects:d.prospects.filter(p=>p.id!==id)}
      : type==='secondary'
        ? {...d,secondary:d.secondary.filter(p=>p.id!==id)}
        : {...d,primary:d.primary.filter(p=>p.id!==id)}
    )
  }


  function promoteSecondary(id:string){
    const source=data.prospects.find(p=>p.id===id)
    if(!source)return
    const group=(window.prompt('Secondary classification: Bus, BU, or Prog','Prog')||'').trim()
    if(!['Bus','BU','Prog'].includes(group))return
    const row:Secondary={id:newId(),group:group as Secondary['group'],name:source.name,company:source.company||'',phone:source.phone,email:source.email,count:source.production,notes:source.notes,callNotes:source.callNotes||'',lastTouch:'',nextAction:''}
    setData(d=>({...d,prospects:d.prospects.filter(p=>p.id!==id),secondary:[...d.secondary,row]}))
    setView('secondary')
  }

  function promotePrimary(id:string){
    const source=data.secondary.find(p=>p.id===id)
    if(!source)return
    const tier=(window.prompt('Primary tier: A, B, or C','C')||'').trim().toUpperCase()
    if(!['A','B','C'].includes(tier))return
    const row:Primary={id:newId(),tier:tier as Primary['tier'],name:source.name,company:source.company||'',phone:source.phone,email:source.email,birthday:'',tie:source.group,families:source.count,notes:source.notes,callNotes:source.callNotes||'',lastTouch:source.lastTouch,nextAction:source.nextAction}
    setData(d=>({...d,secondary:d.secondary.filter(p=>p.id!==id),primary:[...d.primary,row]}))
    setView('primary')
  }

  function demoteSecondary(id:string){
    const source=data.primary.find(p=>p.id===id)
    if(!source)return
    const row:Secondary={id:newId(),group:'BU',name:source.name,company:source.company||'',phone:source.phone,email:source.email,count:source.families,notes:source.notes||'Moved from Primary',callNotes:source.callNotes||'',lastTouch:source.lastTouch,nextAction:source.nextAction}
    setData(d=>({...d,primary:d.primary.filter(p=>p.id!==id),secondary:[...d.secondary,row]}))
    setView('secondary')
  }
  function demoteProspect(id:string){
    const source=data.secondary.find(p=>p.id===id)
    if(!source)return
    const row:Prospect={id:newId(),name:source.name,company:source.company||'',phone:source.phone,email:source.email,production:source.count,notes:source.notes,callNotes:source.callNotes||'',stage:2}
    setData(d=>({...d,secondary:d.secondary.filter(p=>p.id!==id),prospects:[...d.prospects,row]}))
    setView('prospects')
  }


  function downloadProspectSample(){
    const sample=[
      ['name','company','phone','email','production','notes','call_notes'],
      ['Jane Smith','Example Realty','760-555-0101','jane@example.com','14','Goal: grow VA business. Challenge: consistent lead follow-up.',''],
      ['John Doe','Coastal Homes','858-555-0102','john@example.com','22','Focused on listings and move-up buyers.','Sent intro email; follow up next Realtor Day.'],
    ]
    const blob=new Blob([sample.map(row=>row.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='realtor-prospect-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importProspects(file:File){
    const text=await file.text()
    const rows=parseCsv(text)
    if(rows.length<2)return
    const headers=rows[0].map(normalizeHeader)
    const pos=(...names:string[])=>headers.findIndex(h=>names.includes(h))
    const nameI=pos('name','agent','agentname','realtor','realtorname')
    if(nameI<0){window.alert('Import requires a Name column. Download the sample CSV for the expected format.');return}
    const companyI=pos('company','brokerage')
    const phoneI=pos('phone','phonenumber','mobile','cell')
    const emailI=pos('email','emailaddress')
    const prodI=pos('production','sides','families','familieshelped')
    const notesI=pos('notes','relationshipnotes')
    const callNotesI=pos('callnotes','weeklycallnotes')
    const imported:Prospect[]=rows.slice(1).map(cols=>{
      const read=(i:number)=>i>=0?(cols[i]||'').trim():''
      const production=read(prodI)
      return {
        id:newId(),name:read(nameI),company:read(companyI),phone:read(phoneI),email:read(emailI),
        production:production!==''&&Number.isFinite(Number(production))?Number(production):null,
        notes:read(notesI),callNotes:read(callNotesI),stage:0,
      }
    }).filter(row=>row.name)
    if(!imported.length){window.alert('No prospect rows with names were found.');return}
    setData(d=>({...d,prospects:[...d.prospects,...imported]}))
    setView('prospects')
    window.alert(imported.length+' prospects imported as Not Started.')
  }


  function downloadSecondarySample(){
    const sample=[
      ['name','company','phone','email','classification','families_sides','last_touch','notes','call_notes'],
      ['Jane Smith','Example Realty','760-555-0101','jane@example.com','Bus','4','2026-10-19','Goal: grow VA business. Challenge: consistent lead follow-up.','Sent lead; discuss at next call.'],
      ['John Doe','Coastal Homes','858-555-0102','john@example.com','BU','2','','Good second-opinion relationship.',''],
    ]
    const blob=new Blob([sample.map(row=>row.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='realtor-secondary-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importSecondary(file:File){
    const text=await file.text()
    const rows=parseCsv(text)
    if(rows.length<2)return
    const headers=rows[0].map(normalizeHeader)
    const pos=(...names:string[])=>headers.findIndex(h=>names.includes(h))
    const nameI=pos('name','agent','agentname','realtor','realtorname')
    if(nameI<0){window.alert('Import requires a Name column. Download the sample CSV for the expected format.');return}
    const companyI=pos('company','brokerage')
    const phoneI=pos('phone','phonenumber','mobile','cell')
    const emailI=pos('email','emailaddress')
    const groupI=pos('classification','group','relationship')
    const countI=pos('familiessides','families','sides','production')
    const touchI=pos('lasttouch','lastcontact')
    const notesI=pos('notes','relationshipnotes')
    const callNotesI=pos('callnotes','weeklycallnotes')
    const imported:Secondary[]=rows.slice(1).map(cols=>{
      const read=(i:number)=>i>=0?(cols[i]||'').trim():''
      const rawGroup=read(groupI)
      const group:Secondary['group']=rawGroup.toLowerCase()==='bus'?'Bus':rawGroup.toLowerCase()==='prog'?'Prog':'BU'
      const count=read(countI)
      return {
        id:newId(),group,name:read(nameI),company:read(companyI),phone:read(phoneI),email:read(emailI),
        count:count!==''&&Number.isFinite(Number(count))?Number(count):null,
        notes:read(notesI),callNotes:read(callNotesI),lastTouch:read(touchI),nextAction:'',
      }
    }).filter(row=>row.name)
    if(!imported.length){window.alert('No secondary rows with names were found.');return}
    setData(d=>({...d,secondary:[...d.secondary,...imported]}))
    setView('secondary')
    window.alert(imported.length+' secondary relationships imported.')
  }

  function downloadPrimarySample(){
    const sample=[
      ['name','company','phone','email','tier','families_helped','birthday','partnership_tie','last_touch','notes','call_notes'],
      ['Jane Smith','Example Realty','760-555-0101','jane@example.com','A','12','1982-04-14','Business / VA','2026-10-19','Goal: grow team and listing business.','Sent lead; follow up on listing.'],
      ['John Doe','Coastal Homes','858-555-0102','john@example.com','B','6','','Backup / Jumbo','','Strong referral partner.',''],
    ]
    const blob=new Blob([sample.map(row=>row.map(csvCell).join(',')).join('\n')],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='realtor-primary-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importPrimary(file:File){
    const text=await file.text()
    const rows=parseCsv(text)
    if(rows.length<2)return
    const headers=rows[0].map(normalizeHeader)
    const pos=(...names:string[])=>headers.findIndex(h=>names.includes(h))
    const nameI=pos('name','agent','agentname','realtor','realtorname')
    if(nameI<0){window.alert('Import requires a Name column. Download the sample CSV for the expected format.');return}
    const companyI=pos('company','brokerage')
    const phoneI=pos('phone','phonenumber','mobile','cell')
    const emailI=pos('email','emailaddress')
    const tierI=pos('tier','relationship')
    const familiesI=pos('familieshelped','families','sides','production')
    const birthdayI=pos('birthday','birthdate')
    const tieI=pos('partnershiptie','tie','relationshiptype')
    const touchI=pos('lasttouch','lastcontact')
    const notesI=pos('notes','relationshipnotes')
    const callNotesI=pos('callnotes','weeklycallnotes')
    const imported:Primary[]=rows.slice(1).map(cols=>{
      const read=(i:number)=>i>=0?(cols[i]||'').trim():''
      const rawTier=read(tierI).toUpperCase()
      const tier:Primary['tier']=rawTier==='A'||rawTier==='B'?rawTier:'C'
      const families=read(familiesI)
      return {
        id:newId(),tier,name:read(nameI),company:read(companyI),phone:read(phoneI),email:read(emailI),
        birthday:read(birthdayI),tie:read(tieI),
        families:families!==''&&Number.isFinite(Number(families))?Number(families):null,
        notes:read(notesI),callNotes:read(callNotesI),lastTouch:read(touchI),nextAction:'',
      }
    }).filter(row=>row.name)
    if(!imported.length){window.alert('No primary rows with names were found.');return}
    setData(d=>({...d,primary:[...d.primary,...imported]}))
    setView('primary')
    window.alert(imported.length+' primary relationships imported.')
  }

  function exportCallCsv(kind:'secondary'|'primary'){
    const rows=kind==='secondary'?shownSecondary:shownPrimary
    const headers=['Name','Company','Phone','Email','Relationship','Last Touch','Notes','Call Notes']
    const lines=[headers.map(csvCell).join(',')]
    rows.forEach((row:any)=>{
      const relationship=kind==='secondary'?row.group:row.tier
      lines.push([row.name,row.company,row.phone,row.email,relationship,row.lastTouch,row.notes,row.callNotes||''].map(csvCell).join(','))
    })
    const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='realtor-'+kind+'-call-list.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function printCallList(kind:'secondary'|'primary'){
    const rows=kind==='secondary'?shownSecondary:shownPrimary
    const title=kind==='secondary'?'Secondary Realtor Call List':'Primary Realtor Call List'
    const body=rows.map((row:any)=>{
      const relationship=kind==='secondary'?row.group:row.tier
      return '<tr>'+
        '<td><strong>'+htmlEscape(row.name)+'</strong><div class="sub">'+htmlEscape(row.company)+'</div></td>'+
        '<td>'+htmlEscape(row.phone)+'</td>'+
        '<td>'+htmlEscape(relationship)+'</td>'+
        '<td>'+htmlEscape(prettyTouchDate(row.lastTouch))+'</td>'+
        '<td>'+htmlEscape(row.notes)+'</td>'+
        '<td>'+htmlEscape(row.callNotes||'')+'</td>'+
        '<td class="manual"></td>'+
      '</tr>'
    }).join('')
    const w=window.open('','_blank','width=1100,height=800')
    if(!w)return
    w.document.write('<!doctype html><html><head><title>'+title+'</title><style>'+
      'body{font-family:Arial,sans-serif;color:#1f2937;margin:28px}h1{margin:0 0 6px;font-size:24px}.meta{color:#6b7280;font-size:12px;margin-bottom:18px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f3f4f6;text-align:left;padding:8px;border:1px solid #d1d5db}td{vertical-align:top;padding:9px;border:1px solid #d1d5db}.sub{font-size:10px;color:#6b7280;margin-top:2px}.manual{height:48px;min-width:180px}@media print{body{margin:.35in}button{display:none}}'+
      '</style></head><body><h1>'+title+'</h1><div class="meta">'+rows.length+' contacts · '+new Date().toLocaleDateString('en-US')+'</div>'+
      '<table><thead><tr><th>Agent</th><th>Phone</th><th>Level</th><th>Last Touch</th><th>Notes</th><th>Call Notes</th><th>New Call Notes</th></tr></thead><tbody>'+body+'</tbody></table>'+
      '<script>window.onload=()=>window.print()<\/script></body></html>')
    w.document.close()
  }

  function exportData(){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a')
    a.href=url
    a.download='realtor-partner-engine-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="w-full p-[22px] text-[#1f2937]">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#d8dee8] bg-white px-3 py-2.5">
        <div className="text-sm font-black">Realtor Partner Engine</div>
        <nav className="flex flex-wrap gap-1.5">
          {([
            ['dashboard','Dashboard'],
            ['prospects','Prospects '+(data.prospects.length||'')],
            ['secondary','Secondary '+(data.secondary.length||'')],
            ['primary','Primary '+(data.primary.length||'')],
            ['process','Process'],
          ] as [View,string][]).map(([key,label])=>(
            <button key={key} onClick={()=>setView(key)} className={'rounded-[9px] px-2.5 py-2 text-xs font-extrabold '+(view===key?'bg-[#1f4b7a] text-white':'hover:bg-[#eef4fa]')}>{label}</button>
          ))}
        </nav>
        <div className="flex gap-2">
          <button onClick={exportData} className="rounded-[10px] border border-[#d8dee8] bg-white px-3 py-2 text-xs font-extrabold">Export</button>
          <button onClick={()=>setModal('prospect')} className="rounded-[10px] bg-[#1f4b7a] px-3 py-2 text-xs font-extrabold text-white">+ Add Agent</button>
        </div>
      </div>

      {view==='dashboard' && <>
        <PageHead eyebrow="Relationship Pipeline" title="Realtor Partner Engine" copy="Build a deliberate agent prospecting pipeline, earn a place on the lender roster, and develop relationships from prospect to secondary resource to primary lender." />
        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active Prospects" value={data.prospects.length} sub="agents in prospecting workflow" />
          <Metric label="Secondary Partners" value={data.secondary.length} sub="backup / specialist relationships" />
          <Metric label="Primary Partners" value={data.primary.length} sub="primary lender relationships" />
          <Metric label="Relationship Potential" value={relationshipPotential} sub="modeled closings/mo @ .1875 each" />
        </div>
        <div className="mb-4 grid gap-3 lg:grid-cols-3">
          <Flow n="01 — PROSPECT" title="Earn the meeting" copy="Identify productive agents, make initial contact, set the meeting, and complete the prospecting sequence." />
          <Flow n="02 — SECONDARY" title="Get on the roster" copy="Become useful as a business resource, backup lender, or program specialist. The goal is access—not immediate replacement of their lender." />
          <Flow n="03 — PRIMARY" title="Deepen the relationship" copy="Move proven partners into higher-touch relationship management and A/B/C productivity tiers." />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr]">
          <section className="flex h-[245px] flex-col rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
            <div className="mb-3 flex justify-between"><h2 className="text-xl font-extrabold">Prospecting Queue</h2><span className="text-[11px] text-[#6b7280]">{activeTouches} active touches</span></div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {data.prospects.length===0?<p className="text-sm text-[#6b7280]">No prospects yet. Add an agent to begin.</p>:data.prospects.slice().sort((a,b)=>b.stage-a.stage).map(a=>(
                <div key={a.id} className="flex items-center border-b border-[#e9edf2] py-2.5 last:border-b-0"><div><div className="text-[13px] font-extrabold">{a.name}</div><div className="text-[11px] text-[#6b7280]">{a.company||a.notes||'Prospect'}</div></div><span className="ml-auto rounded-full border border-[#bfd0df] bg-[#eef4fa] px-2 py-1 text-[10px] font-extrabold text-[#1f4b7a]">{stageLabel(a.stage)}</span></div>
              ))}
            </div>
          </section>
          <section className="h-[245px] rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
            <h2 className="mb-3 text-xl font-extrabold">Operating Rules</h2>
            <p className="text-sm">The first win is not becoming the agent&apos;s primary lender. The first win is becoming a credible <strong>secondary resource</strong> and earning opportunities over time.</p>
            <div className="my-4 rounded-[10px] bg-[#eef4fa] p-3 text-sm"><strong>Model:</strong> each developed agent relationship is worth approximately <strong>.1875 deals per month</strong>.</div>
            <button onClick={()=>setView('process')} className="rounded-[10px] border border-[#d8dee8] bg-white px-4 py-2.5 text-sm font-extrabold">View full process →</button>
          </section>
        </div>
      </>}

      {view==='prospects' && <>
        <PageHead eyebrow="Realtor Prospecting" title="Prospects" copy="Your working prospect list. Keep untouched prospects as Not Started, record contact and meeting progress, then convert qualified relationships into Secondary." action={<div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-[10px] border border-[#1f4b7a] bg-white px-4 py-3 text-sm font-bold text-[#1f4b7a]">Import Prospects<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importProspects(file);e.currentTarget.value='' }}/></label><button onClick={downloadProspectSample} className="rounded-[10px] border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold">Sample CSV</button><button onClick={()=>setModal('prospect')} className="rounded-[10px] bg-[#1f4b7a] px-4 py-3 text-sm font-bold text-white">+ Add Prospect</button></div>} />
        <Toolbar>
          <input value={prospectSearch} onChange={e=>setProspectSearch(e.target.value)} className={input+' min-w-[250px]'} placeholder="Search agent, company, note..." />
          <select value={prospectStage} onChange={e=>setProspectStage(e.target.value)} className={input}>
            <option value="all">All stages</option><option value="0">Not started</option><option value="1">Initial contact</option><option value="2">Meeting</option>
          </select>
        </Toolbar>
        <Table headers={['Agent','Production','Company','Contact','Notes','Call Notes','Status','Promote']} rows={shownProspects.map(a=>[
          <RecordName key="n" name={a.name} sub={a.email} onClick={()=>setEditing({type:'prospect',id:a.id})}/>,
          a.production??'—',
          a.company||'—',
          a.phone||'—',
          <NotePreview key="notes" value={a.notes}/>,
          <InlineCallNotes key="callnotes" value={a.callNotes||''} onChange={callNotes=>updateProspect(a.id,{callNotes})}/>,
          <InlineStage key="s" value={a.stage} onChange={stage=>updateProspect(a.id,{stage})}/>,
          <button key="promote" onClick={()=>promoteSecondary(a.id)} className={miniPrimary}>Promote → Secondary</button>
        ])}/>
      </>}

      {view==='secondary' && <>
        <PageHead eyebrow="Roster Position" title="Secondary Relationships" copy="Working Realtor relationships where you have earned a place on the roster. Keep the sheet current, stay useful, and graduate relationships to Primary when referral activity grows." action={<div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-[10px] border border-[#1f4b7a] bg-white px-4 py-3 text-sm font-bold text-[#1f4b7a]">Import Secondary<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importSecondary(file);e.currentTarget.value='' }}/></label><button onClick={downloadSecondarySample} className="rounded-[10px] border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold">Sample CSV</button><button onClick={()=>setModal('secondary')} className="rounded-[10px] bg-[#1f4b7a] px-4 py-3 text-sm font-bold text-white">+ Add Secondary</button></div>} />
        <Cadence label="Relationship cadence" items={['Call semi-monthly','Meet quarterly','Book / gift annually']} />
        <div className="mb-4 grid gap-3 md:grid-cols-3"><ClassCard title="BUS — Business" copy="Coaching, lead strategy, business planning, growth conversations."/><ClassCard title="BU — Backup" copy="Save deals, second opinions, difficult scenarios, fast-close resource."/><ClassCard title="PROG — Program" copy="Known specialist for VA or another product niche."/></div>
        <Toolbar><input value={secondarySearch} onChange={e=>setSecondarySearch(e.target.value)} className={input+' min-w-[250px]'} placeholder="Search secondary partners..."/><select value={secondaryGroup} onChange={e=>setSecondaryGroup(e.target.value)} className={input}><option value="all">All groups</option><option>Bus</option><option>BU</option><option>Prog</option></select><div className="ml-auto flex flex-wrap gap-2"><button onClick={()=>printCallList('secondary')} className={mini}>Print / PDF Call List</button><button onClick={()=>exportCallCsv('secondary')} className={mini}>Export Dialer CSV</button></div></Toolbar>
        <Table headers={['Group','Agent','Contact','Families / Sides','Last Touch','Notes','Call Notes','Promote']} rows={shownSecondary.map(a=>[
          <Pill key="g">{a.group}</Pill>,
          <RecordName key="n" name={a.name} sub={a.email} onClick={()=>setEditing({type:'secondary',id:a.id})}/>,
          a.phone||'—',
          a.count??'—',
          <InlineLastTouch key="touch" value={a.lastTouch||''} onChange={lastTouch=>updateSecondary(a.id,{lastTouch})}/>,
          <NotePreview key="notes" value={a.notes}/>,
          <InlineCallNotes key="callnotes" value={a.callNotes||''} onChange={callNotes=>updateSecondary(a.id,{callNotes})}/>,
          <button key="promote" onClick={()=>promotePrimary(a.id)} className={miniPrimary}>Promote → Primary</button>
        ])}/>
      </>}

      {view==='primary' && <>
        <PageHead eyebrow="Core Referral Partners" title="Primary Relationships" copy="Core Realtor accounts. Keep relationship details, referral activity, notes, and last-touch dates current; tier A/B/C by actual production." action={<div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-[10px] border border-[#1f4b7a] bg-white px-4 py-3 text-sm font-bold text-[#1f4b7a]">Import Primary<input type="file" accept=".csv,text/csv" className="hidden" onChange={e=>{const file=e.target.files?.[0];if(file)void importPrimary(file);e.currentTarget.value='' }}/></label><button onClick={downloadPrimarySample} className="rounded-[10px] border border-[#d8dee8] bg-white px-4 py-3 text-sm font-bold">Sample CSV</button><button onClick={()=>setModal('primary')} className="rounded-[10px] bg-[#1f4b7a] px-4 py-3 text-sm font-bold text-white">+ Add Primary</button></div>} />
        <Cadence label="Relationship cadence" items={['Call weekly','Meet monthly','Book / gift quarterly','Birthday annually']} />
        <div className="mb-4 grid gap-3 md:grid-cols-3"><ClassCard title="A — 1 transaction / month" copy="Highest-value partner tier."/><ClassCard title="B — 1 transaction / quarter" copy="Consistent producing relationship."/><ClassCard title="C — 1 transaction / year" copy="Maintain and develop the relationship."/></div>
        <Toolbar><input value={primarySearch} onChange={e=>setPrimarySearch(e.target.value)} className={input+' min-w-[250px]'} placeholder="Search primary partners..."/><select value={primaryTier} onChange={e=>setPrimaryTier(e.target.value)} className={input}><option value="all">All tiers</option><option>A</option><option>B</option><option>C</option></select><div className="ml-auto flex flex-wrap gap-2"><button onClick={()=>printCallList('primary')} className={mini}>Print / PDF Call List</button><button onClick={()=>exportCallCsv('primary')} className={mini}>Export Dialer CSV</button></div></Toolbar>
        <Table headers={['Tier','Agent','Contact','Birthday','Partnership Tie','Families Helped','Last Touch','Notes','Call Notes']} rows={shownPrimary.map(a=>[
          <Pill key="t">{a.tier}</Pill>,
          <RecordName key="n" name={a.name} sub={a.email} onClick={()=>setEditing({type:'primary',id:a.id})}/>,
          a.phone||'—',
          a.birthday||'—',
          a.tie||'—',
          a.families??'—',
          <InlineLastTouch key="touch" value={a.lastTouch||''} onChange={lastTouch=>updatePrimary(a.id,{lastTouch})}/>,
          <NotePreview key="notes" value={a.notes}/>,
          <InlineCallNotes key="callnotes" value={a.callNotes||''} onChange={callNotes=>updatePrimary(a.id,{callNotes})}/>
        ])}/>
      </>}

      {view==='process' && <Process/>}

      {editing && <RecordModal
        record={editing}
        data={data}
        onClose={()=>setEditing(null)}
        onSave={(type,id,patch)=>{
          if(type==='prospect') updateProspect(id,patch as Partial<Prospect>)
          else if(type==='secondary') updateSecondary(id,patch as Partial<Secondary>)
          else updatePrimary(id,patch as Partial<Primary>)
        }}
        onConvertProspect={id=>{setEditing(null);promoteSecondary(id)}}
        onGraduateSecondary={id=>{setEditing(null);promotePrimary(id)}}
        onMoveSecondaryToProspect={id=>{setEditing(null);demoteProspect(id)}}
        onMovePrimaryToSecondary={id=>{setEditing(null);demoteSecondary(id)}}
        onDeleteAgent={(type,id)=>{setEditing(null);deleteAgent(type,id)}}
      />}

      {modal && <AgentModal type={modal} onClose={()=>setModal(null)} onSave={row=>{
        const destination=modal
        setData(d=>destination==='prospect'?{...d,prospects:[...d.prospects,row as Prospect]}:destination==='secondary'?{...d,secondary:[...d.secondary,row as Secondary]}:{...d,primary:[...d.primary,row as Primary]})
        setModal(null)
        setView(destination==='prospect'?'prospects':destination)
      }}/>}

      <p className="mt-5 text-xs text-[#6b7280]">Realtor relationship data is saved automatically in this browser. Use Export periodically for a portable backup.</p>
    </main>
  )
}

function Process(){
  return <>
    <PageHead eyebrow="Realtor Relationship Process" title="Prospecting Process" copy="A repeatable workflow for identifying productive agents, earning the meeting, following up with solutions, and maintaining the relationship."/>
    <div className="grid gap-4 lg:grid-cols-2">
      <ProcessCard title="1. Identify"><ul className={list}><li>Listing agents from past purchase transactions</li><li>Current listing agents</li><li>Referral introductions / Triangle for Trust</li><li>Agents your buyers are already working with</li><li>Agents in your community or niche</li><li>Lunch &amp; Learn classes and open houses</li></ul></ProcessCard>
      <ProcessCard title="2. Quantify"><ol className={list}><li><strong>10+ sides/year:</strong> in-person or Zoom meeting</li><li><strong>5+ sides/year:</strong> Zoom meeting</li><li><strong>&lt;5 sides/year:</strong> phone/email + marketing nurture</li></ol></ProcessCard>
      <ProcessCard title="3. Meet"><ul className={list}><li>In-person or Zoom meeting</li><li>Past / Present / Future conversation</li><li>Identify the opportunity: Primary · Business · Program/Product · Backup/Second Opinion</li></ul></ProcessCard>
      <ProcessCard title="4. Follow Up"><ul className={list}><li>Email follow-up summary</li><li>Add/update CRM for mail and email</li><li>Add to Realtor calling list</li><li>Send contact information by text</li><li>Send thank-you card</li></ul></ProcessCard>
    </div>

    <div className="mt-[22px]">
      <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Steps</div>
      <h2 className="mb-4 mt-1 text-xl font-extrabold">Prospect Conversion</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProcessCard title="1. Initial Contact + Set the Meeting">
          <p className="text-sm">Lead with a specific niche, strength, or reason to connect. Acknowledge that the agent likely already has a lender.</p>
          <div className="mt-3 rounded-xl border border-[#bfd0df] bg-[#f7fbff] p-4 text-sm"><strong>Example:</strong> “I’m a lender and I specialize in VA. I know you have lenders you work with — and that’s OK. I’m not asking you to change that. I’d just like to be on your roster for your VA clients and be another resource when you need one.”</div>
          <ul className={list}><li>Set a 15–30 minute meeting</li><li>In person or over Zoom</li></ul>
        </ProcessCard>
        <ProcessCard title="2. Meeting — Past / Present / Future">
          <p className="text-sm">Keep the meeting focused on learning about the agent, their business, their goals, and what great lender support looks like to them.</p>
          <ul className={list}><li><strong>Past:</strong> How did you get into real estate? What were you doing before?</li><li><strong>Present:</strong> What does your business look like today?</li><li><strong>Future:</strong> What are your goals? What is getting in the way?</li><li>Who do you like as your lender now, and what do you like about them?</li><li>What do you think they could do better?</li><li>If you were a lender for a day, what would you do to provide a very high level of service to clients and agents?</li></ul>
        </ProcessCard>
        <ProcessCard title="3. Follow Up with Solutions">
          <p className="text-sm">Use what the agent shared—especially the impediments to their goals—to make the follow-up personal and useful.</p>
          <ul className={list}><li>Send a thoughtful thank-you</li><li>Follow up with a tool, book, resource, introduction, or solution tied to something they mentioned</li><li>A gift can be appropriate when it reinforces the conversation or relationship</li><li>Show that you listened and can help solve real problems</li></ul>
        </ProcessCard>
        <ProcessCard title="4. AE Call Strategy"><p className="text-sm">Once the relationship is established, maintain it with useful, intentional conversations instead of generic “just checking in” calls.</p></ProcessCard>
      </div>
    </div>

    <div className="mt-[22px]">
      <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">AE Call Strategy</div>
      <h2 className="mb-4 mt-1 text-xl font-extrabold">Ongoing Relationship Maintenance</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProcessCard title="Leads"><ul className={list}><li>Thank them for the leads</li><li>Update status of leads</li><li>Ask about source of leads</li><li>Status of the client with the Realtor</li><li><strong>Programming:</strong> review follow-up process and ask for stale/dead leads you can help re-engage</li></ul></ProcessCard>
        <ProcessCard title="Pre-Approvals"><ul className={list}><li>Does the price point work?</li><li>Would a faster close help?</li><li><strong>Programming:</strong> “Other agents use us for a second opinion. Any clients who need to stretch their pre-approval?”</li><li>Remind them you can close quickly when a future transaction requires it</li></ul></ProcessCard>
        <ProcessCard title="Go-To Conversation"><ul className={list}><li>Industry update: market, trends, guidelines</li><li>Loan program: DSCR, bank statement, VA, etc.</li><li>Sales tactic</li><li>Follow-up on video, book, event, etc.</li><li>Team update: staff and processes</li></ul></ProcessCard>
        <ProcessCard title="Invite"><ul className={list}><li>Happy hour</li><li>Lunch / breakfast / coffee — break bread</li><li>Other event</li></ul></ProcessCard>
      </div>
    </div>

    <div className="mt-[22px] rounded-[10px] bg-[#eef4fa] p-3 text-sm"><strong>Primary principle:</strong> Do not make the opening goal “replace the primary lender.” Get on the roster as a secondary resource and earn the primary relationship later.</div>
  </>
}

function RecordModal({record,data,onClose,onSave,onConvertProspect,onGraduateSecondary,onMoveSecondaryToProspect,onMovePrimaryToSecondary,onDeleteAgent}:{record:EditRecord;data:Store;onClose:()=>void;onSave:(type:ModalType,id:string,patch:Partial<Prospect>|Partial<Secondary>|Partial<Primary>)=>void;onConvertProspect:(id:string)=>void;onGraduateSecondary:(id:string)=>void;onMoveSecondaryToProspect:(id:string)=>void;onMovePrimaryToSecondary:(id:string)=>void;onDeleteAgent:(type:ModalType,id:string)=>void}){
  const source=record.type==='prospect'?data.prospects.find(x=>x.id===record.id):record.type==='secondary'?data.secondary.find(x=>x.id===record.id):data.primary.find(x=>x.id===record.id)
  const [draft,setDraft]=useState<any>(source?{...source}:null)
  if(!source||!draft)return null
  const set=(key:string,value:any)=>setDraft((d:any)=>({...d,[key]:value}))
  function save(){onSave(record.type,record.id,draft);onClose()}
  const title=record.type==='prospect'?'Prospect Record':record.type==='secondary'?'Secondary Relationship':'Primary Relationship'

  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1f293733] p-6 md:p-12" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="w-full max-w-[760px] rounded-2xl border border-[#d8dee8] bg-white p-6">
      <div className="mb-5 flex border-b border-[#d8dee8] pb-4"><div><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">{title}</div><h2 className="mt-1 text-2xl font-extrabold">{draft.name||'Agent'}</h2></div><button onClick={onClose} className="ml-auto text-2xl text-[#6b7280]">×</button></div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Agent Name"><input className={input} value={draft.name||''} onChange={e=>set('name',e.target.value)}/></Field>
        <Field label="Company"><input className={input} value={draft.company||''} onChange={e=>set('company',e.target.value)}/></Field>
        <Field label="Phone"><input className={input} value={draft.phone||''} onChange={e=>set('phone',e.target.value)}/></Field>
        <Field label="Email"><input className={input} value={draft.email||''} onChange={e=>set('email',e.target.value)}/></Field>

        {record.type==='prospect'&&<>
          <Field label="Production / Sides"><input type="number" min="0" className={input} value={draft.production??''} onChange={e=>set('production',e.target.value===''?null:Number(e.target.value))}/></Field>
          <Field label="Prospect Stage"><select className={input} value={draft.stage} onChange={e=>set('stage',Number(e.target.value))}><option value={0}>Not Started</option><option value={1}>Initial Contact</option><option value={2}>Meeting</option></select></Field>
        </>}

        {record.type==='secondary'&&<>
          <Field label="Classification"><select className={input} value={draft.group} onChange={e=>set('group',e.target.value)}><option value="Bus">Bus — Business</option><option value="BU">BU — Backup</option><option value="Prog">Prog — Program</option></select></Field>
          <Field label="Families / Sides"><input type="number" min="0" className={input} value={draft.count??''} onChange={e=>set('count',e.target.value===''?null:Number(e.target.value))}/></Field>
          <DateTouchField value={draft.lastTouch||''} onChange={value=>set('lastTouch',value)}/>
        </>}

        {record.type==='primary'&&<>
          <Field label="Tier"><select className={input} value={draft.tier} onChange={e=>set('tier',e.target.value)}><option>A</option><option>B</option><option>C</option></select></Field>
          <Field label="Families Helped"><input type="number" min="0" className={input} value={draft.families??''} onChange={e=>set('families',e.target.value===''?null:Number(e.target.value))}/></Field>
          <Field label="Birthday"><input className={input} value={draft.birthday||''} onChange={e=>set('birthday',e.target.value)} placeholder="Birthday"/></Field>
          <Field label="Partnership Tie"><input className={input} value={draft.tie||''} onChange={e=>set('tie',e.target.value)} placeholder="Business / VA / Backup / etc."/></Field>
          <DateTouchField value={draft.lastTouch||''} onChange={value=>set('lastTouch',value)}/>
        </>}

        <div className="md:col-span-2"><Field label="Notes — Relationship Profile"><textarea className={input+' min-h-[120px]'} value={draft.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Goals, struggles, challenges, preferences, family/business context, and anything useful for supporting this Realtor long term..."/></Field></div>
        <div className="md:col-span-2"><Field label="Call Notes — Current / Working"><textarea className={input+' min-h-[90px]'} value={draft.callNotes||''} onChange={e=>set('callNotes',e.target.value)} placeholder="Sent lead, follow up with X, discussed listing, call next Realtor Day..."/></Field></div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8dee8] pt-4">
        <div className="flex flex-wrap gap-2">
          {record.type==='secondary'&&<button onClick={()=>{onSave('secondary',record.id,draft);onMoveSecondaryToProspect(record.id)}} className={mini}>← Move to Prospect</button>}
          {record.type==='primary'&&<button onClick={()=>{onSave('primary',record.id,draft);onMovePrimaryToSecondary(record.id)}} className={mini}>← Move to Secondary</button>}
          <button onClick={()=>{if(window.confirm('Delete '+(draft.name||'this agent')+' from the Realtor Partner Engine? This cannot be undone.'))onDeleteAgent(record.type,record.id)}} className="rounded-[9px] border border-[#dc2626] bg-white px-3 py-2 text-xs font-extrabold text-[#b91c1c]">Delete Agent</button>
        </div>
        <div className="flex gap-2"><button onClick={onClose} className={mini}>Cancel</button><button onClick={save} className={miniPrimary}>Save Changes</button></div>
      </div>
    </div>
  </div>
}

function AgentModal({type,onClose,onSave}:{type:ModalType;onClose:()=>void;onSave:(row:Prospect|Secondary|Primary)=>void}){
  const [name,setName]=useState('')
  const [company,setCompany]=useState('')
  const [phone,setPhone]=useState('')
  const [email,setEmail]=useState('')
  const [production,setProduction]=useState('')
  const [notes,setNotes]=useState('')
  const [callNotes,setCallNotes]=useState('')
  const [classification,setClassification]=useState(type==='secondary'?'Bus':type==='primary'?'C':'')

  function save(){
    if(!name.trim())return
    const count=production?Number(production):null
    if(type==='prospect') onSave({id:newId(),name:name.trim(),company:company.trim(),phone:phone.trim(),email:email.trim(),production:count,notes:notes.trim(),callNotes:callNotes.trim(),stage:0})
    else if(type==='secondary') onSave({id:newId(),group:classification as Secondary['group'],name:name.trim(),company:company.trim(),phone:phone.trim(),email:email.trim(),count,notes:notes.trim(),callNotes:callNotes.trim(),lastTouch:'',nextAction:''})
    else onSave({id:newId(),tier:classification as Primary['tier'],name:name.trim(),company:company.trim(),phone:phone.trim(),email:email.trim(),birthday:'',tie:'',families:count,notes:notes.trim(),callNotes:callNotes.trim(),lastTouch:'',nextAction:''})
  }

  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1f293733] p-12" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <div className="w-full max-w-[650px] rounded-2xl border border-[#d8dee8] bg-white p-6">
      <div className="mb-4 flex border-b border-[#d8dee8] pb-4"><div><h2 className="text-xl font-extrabold">Add {type==='prospect'?'Prospect':type==='secondary'?'Secondary Partner':'Primary Partner'}</h2><p className="mt-1 text-xs text-[#6b7280]">{type==='prospect'?'Add an agent to the prospecting queue.':'Add an agent directly to this relationship level.'}</p></div><button onClick={onClose} className="ml-auto text-2xl text-[#6b7280]">×</button></div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Agent Name"><input className={input} value={name} onChange={e=>setName(e.target.value)}/></Field>
        <Field label="Company"><input className={input} value={company} onChange={e=>setCompany(e.target.value)}/></Field>
        <Field label="Phone"><input className={input} value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        <Field label="Email"><input className={input} value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Families / Sides"><input type="number" className={input} value={production} onChange={e=>setProduction(e.target.value)}/></Field>
        {type!=='prospect'&&<Field label={type==='secondary'?'Classification':'Tier'}><select className={input} value={classification} onChange={e=>setClassification(e.target.value)}>{(type==='secondary'?['Bus','BU','Prog']:['A','B','C']).map(x=><option key={x}>{x}</option>)}</select></Field>}
        <div className="md:col-span-2"><Field label="Notes — Relationship Profile"><textarea className={input+' min-h-[82px]'} value={notes} onChange={e=>setNotes(e.target.value)}/></Field></div>
        <div className="md:col-span-2"><Field label="Call Notes"><textarea className={input+' min-h-[70px]'} value={callNotes} onChange={e=>setCallNotes(e.target.value)}/></Field></div>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className={mini}>Cancel</button><button onClick={save} className={miniPrimary}>Save Agent</button></div>
    </div>
  </div>
}

function PageHead({eyebrow,title,copy,action}:{eyebrow:string;title:string;copy:string;action?:ReactNode}){return <div className="mb-[18px] flex flex-wrap items-start justify-between gap-5"><div><div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">{eyebrow}</div><h1 className="mt-1 text-[30px]">{title}</h1><p className="mt-1 max-w-[780px] text-sm text-[#6b7280]">{copy}</p></div>{action}</div>}
function Metric({label,value,sub}:{label:string;value:string|number;sub:string}){return <div className="rounded-[14px] border border-[#d8dee8] bg-white p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div><div className="mt-1 text-[11px] text-[#6b7280]">{sub}</div></div>}
function Flow({n,title,copy}:{n:string;title:string;copy:string}){return <div className="rounded-[14px] border border-[#d8dee8] bg-white p-4"><div className="text-[10px] font-extrabold tracking-[.08em] text-[#6b7280]">{n}</div><div className="mt-1 text-base font-black">{title}</div><p className="mt-1 text-xs text-[#6b7280]">{copy}</p></div>}
function Toolbar({children}:{children:ReactNode}){return <div className="flex flex-wrap gap-2 rounded-t-[14px] border border-b-0 border-[#d8dee8] bg-white p-3">{children}</div>}
function Table({headers,rows}:{headers:string[];rows:ReactNode[][]}){return <div className="overflow-auto rounded-b-[14px] border border-[#d8dee8] bg-white"><table className="w-full min-w-[960px] border-collapse"><thead><tr>{headers.map((h,i)=><th key={h+i} className="border-b border-[#d8dee8] bg-[#f7f9fb] px-2.5 py-3 text-left text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{h}</th>)}</tr></thead><tbody>{rows.length===0?<tr><td colSpan={headers.length} className="p-4 text-sm text-[#6b7280]">No matching records.</td></tr>:rows.map((row,i)=><tr key={i} className="hover:bg-[#fbfcfd]">{row.map((cell,j)=><td key={j} className="border-b border-[#e9edf2] px-2.5 py-3 align-middle text-sm">{cell}</td>)}</tr>)}</tbody></table></div>}
function InlineStage({value,onChange}:{value:number;onChange:(value:number)=>void}){return <select value={value} onChange={e=>onChange(Number(e.target.value))} className="rounded-[8px] border border-[#d8dee8] bg-white px-2 py-1.5 text-xs font-extrabold text-[#1f4b7a] outline-none focus:border-[#1f4b7a]"><option value={0}>Not Started</option><option value={1}>Initial Contact</option><option value={2}>Meeting</option></select>}
function InlineCallNotes({value,onChange}:{value:string;onChange:(value:string)=>void}){return <textarea value={value||''} onChange={e=>onChange(e.target.value)} rows={2} placeholder="Call notes..." className="min-w-[150px] resize-y rounded-[8px] border border-[#d8dee8] bg-white px-2 py-1.5 text-xs leading-5 outline-none focus:border-[#1f4b7a]"/>}
function InlineLastTouch({value,onChange}:{value:string;onChange:(value:string)=>void}){return <div className="flex min-w-[160px] items-center gap-1.5"><input type="date" value={value||''} onChange={e=>onChange(e.target.value)} className="min-w-0 rounded-[8px] border border-[#d8dee8] bg-white px-2 py-1.5 text-xs outline-none focus:border-[#1f4b7a]"/><button type="button" onClick={()=>onChange(todayKey())} className="rounded-[8px] border border-[#d8dee8] bg-white px-2 py-1.5 text-[10px] font-extrabold">Today</button></div>}
function ProgressBadge({value}:{value:number}){return <span className="rounded-full border border-[#bfd0df] bg-[#eef4fa] px-2 py-1 text-[10px] font-extrabold text-[#1f4b7a]">{stageLabel(value)}</span>}
function RecordName({name,sub,onClick}:{name:string;sub:string;onClick:()=>void}){return <button onClick={onClick} className="text-left"><div className="font-extrabold text-[#1f4b7a] hover:underline">{name}</div><div className="text-[11px] text-[#6b7280]">{sub}</div></button>}
function NotePreview({value}:{value:string}){const text=(value||'').trim();return <div className="max-w-[250px] truncate text-xs text-[#4b5563]" title={text}>{text||'—'}</div>}
function Name({name,sub}:{name:string;sub:string}){return <div><div className="font-extrabold">{name}</div><div className="text-[11px] text-[#6b7280]">{sub}</div></div>}
function Pill({children}:{children:ReactNode}){return <span className="rounded-full border border-[#bfd0df] bg-[#eef4fa] px-2 py-1 text-[10px] font-extrabold text-[#1f4b7a]">{children}</span>}
function Cadence({label,items}:{label:string;items:string[]}){return <div className="mb-4 grid overflow-hidden rounded-[14px] border border-[#bfd0df] bg-[#f7fbff] md:grid-cols-[180px_1fr]"><div className="border-b border-[#bfd0df] p-4 font-black md:border-b-0 md:border-r">{label}</div><div className="flex flex-wrap gap-5 p-4">{items.map(x=><span key={x} className="text-xs">{x}</span>)}</div></div>}
function ClassCard({title,copy}:{title:string;copy:string}){return <div className="rounded-[14px] border border-[#d8dee8] bg-white p-4"><strong>{title}</strong><p className="mt-1 text-xs text-[#6b7280]">{copy}</p></div>}
function ProcessCard({title,children}:{title:string;children:ReactNode}){return <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]"><h2 className="text-lg font-extrabold">{title}</h2>{children}</section>}
function DateTouchField({value,onChange}:{value:string;onChange:(value:string)=>void}){return <div><div className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">Last Touch</div><div className="flex gap-2"><input type="date" className={input+' flex-1'} value={value||''} onChange={e=>onChange(e.target.value)}/><button type="button" onClick={()=>onChange(todayKey())} className={mini}>Today</button></div></div>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</span>{children}</label>}
