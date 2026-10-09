'use client'

import { useEffect, useMemo, useState } from 'react'
import OriginatorEngineNav from './nav'
import { DEFAULT_SETTINGS, emptyActivity, type ActivityEntry, type EngineSettings, type WeeklyCloseout } from './storage'
import { activityKeys, aggregate, dateKey, endOfWeek, inRange, previousWeek, startOfWeek } from './week'

const metricLabels = {
  face:'Face-to-Face', bread:'Break Bread', calls:'Great Calls', events:'Events',
  content:'Content', cards:'Thank-You Cards', gifts:'Gifts', newRealtors:'New Realtors',
  newOffices:'Offices / Teams', newVips:'VIPs', leads:'Leads', deals:'Deals',
} as const

const weeklyGoals = [
  ['Face-to-Face','face','weeklyFace'],['Break Bread','bread','weeklyBread'],['Great Calls','calls','weeklyCalls'],
  ['Events','events','weeklyEvents'],['Content','content','weeklyContent'],['Thank-You Cards','cards','weeklyCards'],
] as const

function prettyDate(date:string) {
  return new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})
}
function prettyWeek(start:Date,end:Date) {
  const a=start.toLocaleDateString('en-US',{month:'short',day:'numeric'})
  const b=end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})
  return `${a} – ${b}`
}
function themeForToday(s:EngineSettings,d:Date) {
  const map:Record<number,[string,string,string,string]>={
    1:['Monday','monTheme','monAm','monPm'],2:['Tuesday','tueTheme','tueAm','tuePm'],
    3:['Wednesday','wedTheme','wedAm','wedPm'],4:['Thursday','thuTheme','thuAm','thuPm'],5:['Friday','friTheme','friAm','friPm'],
  }
  const row=map[d.getDay()]
  if(!row) return {day:d.getDay()===0?'Sunday':'Saturday',theme:'FLEX / PERSONAL DAY',am:'No Theme Day configured.',pm:'Use as needed.'}
  return {day:row[0],theme:String(s[row[1] as keyof EngineSettings]),am:String(s[row[2] as keyof EngineSettings]),pm:String(s[row[3] as keyof EngineSettings])}
}

export default function OriginatorEngineActivity() {
  const [rows,setRows]=useState<ActivityEntry[]>([])
  const [settings,setSettings]=useState<EngineSettings>(DEFAULT_SETTINGS)
  const [form,setForm]=useState<ActivityEntry>(emptyActivity())
  const [dailyNote,setDailyNote]=useState('')
  const [saved,setSaved]=useState(false)
  const [noteSaved,setNoteSaved]=useState(false)
  const [showCloseout,setShowCloseout]=useState(false)
  const [closeout,setCloseout]=useState({transactions:0,volume:0,income:0,notes:''})
  const [busy,setBusy]=useState(false)

  useEffect(()=>{
    let cancelled=false
    Promise.all([
      fetch('/api/originator-engine/activity',{cache:'no-store'}),
      fetch('/api/originator-engine/settings',{cache:'no-store'}),
    ]).then(async([a,s])=>{
      if(cancelled)return
      if(a.ok){const body=await a.json();setRows(body.activity??[])}
      if(s.ok){
        const body=await s.json()
        const next={...DEFAULT_SETTINGS,...(body.settings??{}),dailyNotes:{...DEFAULT_SETTINGS.dailyNotes,...(body.settings?.dailyNotes??{})},weeklyCloseouts:{...DEFAULT_SETTINGS.weeklyCloseouts,...(body.settings?.weeklyCloseouts??{})}}
        setSettings(next)
        setDailyNote(next.dailyNotes?.[form.date]??'')
      }
    }).catch(()=>{})
    return()=>{cancelled=true}
  },[])

  useEffect(()=>{setDailyNote(settings.dailyNotes?.[form.date]??'')},[form.date,settings.dailyNotes])

  const now=useMemo(()=>new Date(),[])
  const currentStart=startOfWeek(now)
  const currentEnd=endOfWeek(now)
  const currentRows=rows.filter(r=>inRange(r,currentStart,currentEnd))
  const todayRows=rows.filter(r=>r.date===dateKey(now))
  const weekTotals=aggregate(currentRows)
  const todayTotals=aggregate(todayRows)
  const theme=themeForToday(settings,now)

  const prev=previousWeek(now)
  const prevKey=dateKey(prev.start)
  const prevRows=rows.filter(r=>inRange(r,prev.start,prev.end))
  const prevHasNotes=Object.keys(settings.dailyNotes??{}).some(d=>{
    const x=new Date(d+'T12:00:00'); return x>=prev.start&&x<=prev.end&&Boolean(settings.dailyNotes[d]?.trim())
  })
  const prevNeedsCloseout=(prevRows.length>0||prevHasNotes)&&!settings.weeklyCloseouts?.[prevKey]
  const hardStop=prevNeedsCloseout && now>=currentStart

  const archive=useMemo(()=>{
    const starts=new Map<string,ActivityEntry[]>()
    rows.filter(r=>new Date(r.date+'T12:00:00')<currentStart).forEach(r=>{
      const s=startOfWeek(new Date(r.date+'T12:00:00'))
      const key=dateKey(s); const list=starts.get(key)??[]; list.push(r); starts.set(key,list)
    })
    Object.keys(settings.weeklyCloseouts??{}).forEach(key=>{if(!starts.has(key))starts.set(key,[])})
    return [...starts.entries()].sort(([a],[b])=>b.localeCompare(a)).map(([key,entries])=>{
      const start=new Date(key+'T12:00:00'), end=endOfWeek(start)
      return {key,start,end,entries,totals:aggregate(entries),closeout:settings.weeklyCloseouts?.[key]}
    })
  },[rows,settings.weeklyCloseouts,currentStart])

  function updateMetric(key:typeof activityKeys[number],value:number){setForm(f=>({...f,[key]:value}))}

  async function saveActivity() {
    const hasActivity=activityKeys.some(k=>Number(form[k])>0)
    if(!hasActivity)return
    setBusy(true)
    const payload={...form,type:'bulk',title:'Activity',category:'Other',note:'',date:dateKey(now)}
    const res=await fetch('/api/originator-engine/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    if(res.ok){const body=await res.json();setRows(cur=>[body.entry as ActivityEntry,...cur]);setForm({...emptyActivity(),date:dateKey(now)});setSaved(true);setTimeout(()=>setSaved(false),1600)}
    setBusy(false)
  }

  async function saveSettings(next:EngineSettings) {
    const res=await fetch('/api/originator-engine/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:next})})
    if(!res.ok)return false
    setSettings(next); return true
  }

  async function saveDailyNote(){
    const notes={...(settings.dailyNotes??{})}
    if(dailyNote.trim())notes[form.date]=dailyNote.trim();else delete notes[form.date]
    const ok=await saveSettings({...settings,dailyNotes:notes})
    if(ok){setNoteSaved(true);setTimeout(()=>setNoteSaved(false),1600)}
  }

  async function finalizeWeek() {
    const target=hardStop?prev:{start:currentStart,end:currentEnd}
    const key=dateKey(target.start)
    const item:WeeklyCloseout={weekStart:key,weekEnd:dateKey(target.end),finalizedAt:new Date().toISOString(),transactions:Number(closeout.transactions||0),volume:Number(closeout.volume||0),income:Number(closeout.income||0),notes:closeout.notes.trim()}
    const next={...settings,weeklyCloseouts:{...(settings.weeklyCloseouts??{}),[key]:item}}
    setBusy(true)
    const ok=await saveSettings(next)
    if(ok){setShowCloseout(false);setCloseout({transactions:0,volume:0,income:0,notes:''})}
    setBusy(false)
  }

  const closeoutTarget=hardStop?prev:{start:currentStart,end:currentEnd}
  const canOfferCloseout=hardStop||now.getDay()===5||now.getDay()===6||now.getDay()===0

  if(hardStop){
    const totals=aggregate(prevRows)
    return <main className="mx-auto max-w-[1100px] p-[22px] text-[#1f2937]">
      <OriginatorEngineNav />
      <section className="rounded-2xl border border-[#d9c3aa] bg-[#fffaf4] p-6">
        <div className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#8a5b2b]">Weekly Closeout Required</div>
        <h1 className="mt-1 text-[30px]">Finalize last week before starting this week.</h1>
        <p className="mt-2 max-w-[760px] text-sm leading-6 text-[#6b7280]">Originator Engine runs Monday through Sunday. Review {prettyWeek(prev.start,prev.end)}, add any final notes or activity you missed, then record the production that closed.</p>
        <div className="mt-5 flex flex-wrap gap-2">{activityKeys.filter(k=>totals[k]>0).map(k=><span key={k} className="rounded-[8px] bg-[#eef4fa] px-3 py-1.5 text-[11px] font-bold text-[#1f4b7a]">{totals[k]} {metricLabels[k]}</span>)}</div>
        <CloseoutForm closeout={closeout} setCloseout={setCloseout} onFinalize={finalizeWeek} busy={busy} />
      </section>
    </main>
  }

  return <main className="mx-auto max-w-[1100px] p-[22px] text-[#1f2937]">
    <OriginatorEngineNav />
    <div className="mb-[18px]">
      <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Activity</div>
      <h1 className="mt-1 text-[30px]">This Week</h1>
      <p className="mt-1 text-sm text-[#6b7280]">{prettyWeek(currentStart,currentEnd)} · Monday through Sunday</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-[#bfd0df] bg-[#f7fbff] p-[18px]">
        <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">{theme.day} · Theme Day</div>
        <div className="mt-1 text-2xl font-black">{theme.theme}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2"><Focus title="A.M. Focus" copy={theme.am}/><Focus title="P.M. Focus" copy={theme.pm}/></div>
      </section>
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Today</div>
        <div className="text-xl font-extrabold">Daily Summary</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {activityKeys.filter(k=>todayTotals[k]>0).map(k=><span key={k} className="rounded-[8px] bg-[#eef4fa] px-2.5 py-1 text-[11px] font-bold text-[#1f4b7a]">{todayTotals[k]} {metricLabels[k]}</span>)}
          {todayRows.length===0&&<span className="text-sm text-[#6b7280]">No activity logged yet today.</span>}
        </div>
      </section>
    </div>

    <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
      <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Quick Entry</div>
      <div className="text-xl font-extrabold">Add Activity</div>
      <p className="mt-1 text-xs text-[#6b7280]">Enter only what happened. Leave everything else at zero.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {activityKeys.map(key=><label key={key} className="rounded-xl border border-[#d8dee8] p-3"><span className="mb-1 block text-[11px] font-bold text-[#6b7280]">{metricLabels[key]}</span><input type="number" min="0" className={input} value={Number(form[key])} onChange={e=>updateMetric(key,Number(e.target.value))}/></label>)}
      </div>
      <div className="mt-4 flex items-center gap-3"><button onClick={saveActivity} disabled={busy} className="rounded-[10px] bg-[#1f4b7a] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy?'Saving…':'Save Activity'}</button>{saved&&<span className="text-sm font-bold text-[#315d36]">Activity added to today.</span>}</div>
    </section>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Daily Journal</div>
        <div className="text-xl font-extrabold">Today’s Notes</div>
        <p className="mt-1 text-xs leading-5 text-[#6b7280]">Who did you talk to? What happened? What do you want to remember?</p>
        <textarea className={input+' mt-3 min-h-[110px]'} value={dailyNote} onChange={e=>setDailyNote(e.target.value)} placeholder="Talked with Sarah Smith. Discussed her new listing and VA buyers..." />
        <div className="mt-3 flex items-center gap-3"><button onClick={saveDailyNote} className="rounded-[10px] border border-[#1f4b7a] bg-white px-4 py-2.5 text-sm font-bold text-[#1f4b7a]">Save Daily Notes</button>{noteSaved&&<span className="text-sm font-bold text-[#315d36]">Saved.</span>}</div>
      </section>
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">This Week</div>
        <div className="text-xl font-extrabold">Weekly Progress</div>
        <div className="mt-4 space-y-3">{weeklyGoals.map(([label,key,goal])=>{const target=Number(settings[goal]);const pct=target>0?Math.min(100,(weekTotals[key]/target)*100):0;return <div key={key} className="grid grid-cols-[145px_1fr_70px] items-center gap-3"><div className="text-[12px] font-bold">{label}</div><div className="h-2.5 overflow-hidden rounded-full bg-[#e9edf2]"><div className="h-full rounded-full bg-[#1f4b7a]" style={{width:pct+'%'}}/></div><div className="text-right text-xs font-extrabold">{weekTotals[key]} / {target}</div></div>})}</div>
      </section>
    </div>

    {canOfferCloseout&&<section className="mt-4 rounded-2xl border border-[#d9c3aa] bg-[#fffaf4] p-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#8a5b2b]">Weekly Closeout</div><div className="text-xl font-extrabold">Finalize This Week</div><p className="mt-1 text-xs text-[#6b7280]">Review activity, add final notes, and record transactions, volume, and income received.</p></div><button onClick={()=>setShowCloseout(v=>!v)} className="rounded-[10px] bg-[#1f4b7a] px-4 py-2.5 text-sm font-bold text-white">{showCloseout?'Hide Closeout':'Review & Finalize Week'}</button></div>
      {showCloseout&&<CloseoutForm closeout={closeout} setCloseout={setCloseout} onFinalize={finalizeWeek} busy={busy}/>}
    </section>}

    <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
      <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Archive</div>
      <div className="text-xl font-extrabold">Previous Weeks</div>
      <p className="mt-1 text-xs text-[#6b7280]">Older weeks stay collapsed below. Finalized production feeds Progress automatically.</p>
      <div className="mt-4 space-y-2">{archive.map(w=><details key={w.key} className="rounded-xl border border-[#d8dee8]"><summary className="cursor-pointer list-none p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-sm font-extrabold">{prettyWeek(w.start,w.end)}</div><div className="mt-2 flex flex-wrap gap-2">{activityKeys.filter(k=>w.totals[k]>0).slice(0,6).map(k=><span key={k} className="rounded-[8px] bg-[#eef4fa] px-2.5 py-1 text-[10px] font-bold text-[#1f4b7a]">{w.totals[k]} {metricLabels[k]}</span>)}</div></div><span className="text-[10px] font-bold text-[#6b7280]">{w.closeout?'Finalized':'Open'} · View ↓</span></div></summary>{w.closeout&&<div className="border-t border-[#d8dee8] p-4"><div className="grid gap-3 sm:grid-cols-3"><Mini label="Transactions" value={String(w.closeout.transactions)}/><Mini label="Closed Volume" value={'$'+w.closeout.volume.toLocaleString()}/><Mini label="Income Received" value={'$'+w.closeout.income.toLocaleString()}/></div>{w.closeout.notes&&<div className="mt-3 rounded-[10px] bg-[#f7f9fb] p-3 text-xs text-[#4b5563]">{w.closeout.notes}</div>}</div>}</details>)}</div>
    </section>
  </main>
}

function CloseoutForm({closeout,setCloseout,onFinalize,busy}:{closeout:{transactions:number,volume:number,income:number,notes:string},setCloseout:React.Dispatch<React.SetStateAction<{transactions:number,volume:number,income:number,notes:string}>>,onFinalize:()=>void,busy:boolean}){
  return <div className="mt-5 border-t border-[#eadfce] pt-4"><div className="grid gap-3 md:grid-cols-3"><NumberBox label="Transactions Closed" value={closeout.transactions} onChange={v=>setCloseout(c=>({...c,transactions:v}))}/><NumberBox label="Closed Volume" value={closeout.volume} onChange={v=>setCloseout(c=>({...c,volume:v}))} prefix="$"/><NumberBox label="Income Received" value={closeout.income} onChange={v=>setCloseout(c=>({...c,income:v}))} prefix="$"/></div><label className="mt-4 block"><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">Final Week Notes</span><textarea className={input+' min-h-[90px]'} value={closeout.notes} onChange={e=>setCloseout(c=>({...c,notes:e.target.value}))} placeholder="Anything worth carrying forward into next week?"/></label><button onClick={onFinalize} disabled={busy} className="mt-4 rounded-[10px] bg-[#1f4b7a] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{busy?'Finalizing…':'Finalize Week'}</button></div>
}
function NumberBox({label,value,onChange,prefix}:{label:string,value:number,onChange:(v:number)=>void,prefix?:string}){return <label><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</span><div className="flex items-center rounded-[10px] border border-[#d8dee8] bg-white px-3">{prefix&&<span className="mr-1 text-sm text-[#6b7280]">{prefix}</span>}<input type="number" min="0" className="w-full bg-transparent py-2.5 text-sm outline-none" value={value} onChange={e=>onChange(Number(e.target.value))}/></div></label>}
function Focus({title,copy}:{title:string,copy:string}){return <div className="rounded-[10px] border border-[#d8dee8] bg-white p-3"><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{title}</div><div className="whitespace-pre-line text-[13px] leading-relaxed">{copy}</div></div>}
function Mini({label,value}:{label:string,value:string}){return <div className="rounded-[10px] bg-[#f7f9fb] p-3"><div className="text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{label}</div><div className="mt-1 text-lg font-extrabold">{value}</div></div>}
const input='w-full rounded-[10px] border border-[#d8dee8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f4b7a]'
