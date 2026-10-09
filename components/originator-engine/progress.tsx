'use client'

import { useEffect, useMemo, useState } from 'react'
import OriginatorEngineNav from './nav'
import { DEFAULT_SETTINGS, type ActivityEntry, type EngineSettings, type WeeklyCloseout } from './storage'
import { aggregate, endOfWeek, inRange, money, startOfWeek } from './week'

const weeklyGoals=[
  ['Face-to-Face','face','weeklyFace'],['Break Bread','bread','weeklyBread'],['Great Calls','calls','weeklyCalls'],
  ['Events','events','weeklyEvents'],['Content','content','weeklyContent'],['Thank-You Cards','cards','weeklyCards'],
] as const

function pct(actual:number,goal:number){return goal>0?Math.min(100,Math.round(actual/goal*100)):0}
function startMonth(d:Date){return new Date(d.getFullYear(),d.getMonth(),1)}
function endMonth(d:Date){return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999)}

export default function OriginatorEngineProgress(){
  const [settings,setSettings]=useState<EngineSettings>(DEFAULT_SETTINGS)
  const [activity,setActivity]=useState<ActivityEntry[]>([])

  useEffect(()=>{
    let cancelled=false
    Promise.all([
      fetch('/api/originator-engine/settings',{cache:'no-store'}),
      fetch('/api/originator-engine/activity',{cache:'no-store'}),
    ]).then(async([s,a])=>{
      if(cancelled)return
      if(s.ok){const body=await s.json();setSettings({...DEFAULT_SETTINGS,...(body.settings??{}),dailyNotes:{...DEFAULT_SETTINGS.dailyNotes,...(body.settings?.dailyNotes??{})},weeklyCloseouts:{...DEFAULT_SETTINGS.weeklyCloseouts,...(body.settings?.weeklyCloseouts??{})}})}
      if(a.ok){const body=await a.json();setActivity(body.activity??[])}
    }).catch(()=>{})
    return()=>{cancelled=true}
  },[])

  const now=useMemo(()=>new Date(),[])
  const revenuePerLoan=settings.compType==='flat'?Number(settings.compFlat):Number(settings.avgLoan)*(Number(settings.compBps)/10000)
  const transactionGoal=revenuePerLoan>0?Number(settings.annualIncome)/revenuePerLoan:0
  const volumeGoal=transactionGoal*Number(settings.avgLoan)
  const closeouts=Object.values(settings.weeklyCloseouts??{}) as WeeklyCloseout[]
  const yearCloseouts=closeouts.filter(c=>new Date(c.weekEnd+'T12:00:00').getFullYear()===now.getFullYear())
  const ytd=yearCloseouts.reduce((a,c)=>({transactions:a.transactions+Number(c.transactions||0),volume:a.volume+Number(c.volume||0),income:a.income+Number(c.income||0)}),{transactions:0,volume:0,income:0})

  const monthRows=activity.filter(r=>inRange(r,startMonth(now),endMonth(now)))
  const monthTotals=aggregate(monthRows)
  const monthlyWeeks=Math.max(1,Math.ceil(now.getDate()/7))

  const recentMonths=useMemo(()=>Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1)
    const label=d.toLocaleDateString('en-US',{month:'short'})
    const items=yearCloseouts.filter(c=>{const x=new Date(c.weekEnd+'T12:00:00');return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()})
    return {label,transactions:items.reduce((n,c)=>n+Number(c.transactions||0),0),volume:items.reduce((n,c)=>n+Number(c.volume||0),0),income:items.reduce((n,c)=>n+Number(c.income||0),0)}
  }),[yearCloseouts,now])

  const maxVolume=Math.max(1,...recentMonths.map(m=>m.volume))
  const maxIncome=Math.max(1,...recentMonths.map(m=>m.income))

  const finalizedWeeks=[...yearCloseouts].sort((a,b)=>a.weekStart.localeCompare(b.weekStart)).slice(-8).map(c=>{
    const start=new Date(c.weekStart+'T12:00:00'),end=endOfWeek(start)
    const rows=activity.filter(r=>inRange(r,start,end))
    const totals=aggregate(rows)
    const complete=weeklyGoals.every(([,key,goal])=>Number(settings[goal])<=0||totals[key]>=Number(settings[goal]))
    return {c,totals,complete}
  })

  return <main className="mx-auto max-w-[1180px] p-[22px] text-[#1f2937]">
    <OriginatorEngineNav />
    <div className="mb-[18px]">
      <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Progress</div>
      <h1 className="mt-1 text-[30px]">Is the activity producing the business?</h1>
      <p className="mt-1 text-sm text-[#6b7280]">Read-only dashboard built from your Goals, daily activity, and finalized weekly production.</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <GoalCard label="Transactions YTD" actual={ytd.transactions.toFixed(0)} goal={transactionGoal.toFixed(0)} percent={pct(ytd.transactions,transactionGoal)} />
      <GoalCard label="Funded Volume YTD" actual={money(ytd.volume)} goal={money(volumeGoal)} percent={pct(ytd.volume,volumeGoal)} />
      <GoalCard label="Income YTD" actual={money(ytd.income)} goal={money(Number(settings.annualIncome))} percent={pct(ytd.income,Number(settings.annualIncome))} />
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="flex items-start justify-between gap-4"><div><Kicker>Production Trend</Kicker><div className="text-xl font-extrabold">Monthly Production</div><p className="mt-1 text-xs text-[#6b7280]">Volume and income from finalized weeks.</p></div><div className="text-[10px] text-[#6b7280]">NAVY Volume · COPPER Income</div></div>
        <div className="mt-6 flex h-[220px] items-end gap-4 border-b border-[#d8dee8] px-2">
          {recentMonths.map(m=><div key={m.label} className="flex h-full flex-1 items-end justify-center gap-1"><div className="w-[18px] rounded-t bg-[#1f4b7a]" style={{height:Math.max(3,m.volume/maxVolume*100)+'%'}} title={money(m.volume)}/><div className="w-[18px] rounded-t bg-[#a26028]" style={{height:Math.max(3,m.income/maxIncome*100)+'%'}} title={money(m.income)}/></div>)}
        </div>
        <div className="mt-2 grid grid-cols-6 gap-4 text-center text-[10px] font-bold text-[#6b7280]">{recentMonths.map(m=><span key={m.label}>{m.label}</span>)}</div>
      </section>

      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Kicker>Current Month</Kicker><div className="text-xl font-extrabold">Prospecting Progress</div><p className="mt-1 text-xs text-[#6b7280]">Monthly pace based on your weekly activity standards.</p>
        <div className="mt-5 space-y-4">{weeklyGoals.map(([label,key,goal])=>{const target=Number(settings[goal])*monthlyWeeks;const p=pct(monthTotals[key],target);return <div key={key}><div className="mb-1 flex justify-between gap-3 text-xs"><strong>{label}</strong><strong>{monthTotals[key]} / {target}</strong></div><div className="h-2.5 overflow-hidden rounded-full bg-[#e9edf2]"><div className="h-full rounded-full bg-[#1f4b7a]" style={{width:p+'%'}}/></div></div>})}</div>
      </section>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Kicker>Business Development</Kicker><div className="text-xl font-extrabold">This Month</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Mini label="New Realtors" value={monthTotals.newRealtors} goal={Number(settings.monthlyRealtors)}/>
          <Mini label="Offices / Teams" value={monthTotals.newOffices} goal={Number(settings.monthlyOffices)}/>
          <Mini label="VIPs" value={monthTotals.newVips} goal={Number(settings.monthlyVips)}/>
          <Mini label="Gifts" value={monthTotals.gifts} goal={Number(settings.monthlyGifts)}/>
        </div>
      </section>
      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Kicker>Results</Kicker><div className="text-xl font-extrabold">Leads & Deals</div>
        <div className="mt-4 grid grid-cols-2 gap-3"><Big label="Leads This Month" value={monthTotals.leads}/><Big label="Deals This Month" value={monthTotals.deals}/></div>
      </section>
    </div>

    <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
      <Kicker>Greatness Weeks</Kicker><div className="text-xl font-extrabold">Consistency</div><p className="mt-1 text-xs text-[#6b7280]">Finalized weeks that met every active weekly activity target.</p>
      {finalizedWeeks.length===0?<p className="mt-4 text-sm text-[#6b7280]">Finalize your first week to start building the history.</p>:<div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">{finalizedWeeks.map(({c,complete})=><div key={c.weekStart} className={'rounded-[10px] border p-3 text-center '+(complete?'border-[#bfd0df] bg-[#eef4fa]':'border-[#d8dee8] bg-white')}><div className={'text-sm font-black '+(complete?'text-[#1f4b7a]':'text-[#1f2937]')}>{complete?'✓':'—'}</div><div className="mt-1 text-[9px] text-[#6b7280]">{new Date(c.weekStart+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div></div>)}</div>}
    </section>
  </main>
}

function GoalCard({label,actual,goal,percent}:{label:string,actual:string,goal:string,percent:number}){return <section className="relative overflow-hidden rounded-2xl border border-[#d8dee8] bg-white p-[18px]"><div className="absolute inset-y-0 left-0 w-1 bg-[#1f4b7a]"/><Kicker>{label}</Kicker><div className="mt-2 flex items-end justify-between gap-4"><div><div className="text-[29px] font-black">{actual}</div><div className="mt-1 text-[11px] text-[#6b7280]">Goal: {goal}</div></div><div className="text-xl font-black text-[#1f4b7a]">{percent}%</div></div><div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#e9edf2]"><div className="h-full rounded-full bg-[#1f4b7a]" style={{width:percent+'%'}}/></div></section>}
function Mini({label,value,goal}:{label:string,value:number,goal:number}){return <div className="rounded-xl bg-[#f7f9fb] p-3"><div className="text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</div><div className="mt-1 text-xl font-extrabold">{value} / {goal}</div></div>}
function Big({label,value}:{label:string,value:number}){return <div className="rounded-xl bg-[#f7f9fb] p-4"><div className="text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>}
function Kicker({children}:{children:React.ReactNode}){return <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">{children}</div>}
