'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import OriginatorEngineNav from './nav'
import { DEFAULT_SETTINGS, type ActivityEntry, type EngineSettings } from './storage'

const weekly = [
  ['Face-to-Face','face','weeklyFace'],
  ['Break Bread','bread','weeklyBread'],
  ['Great Calls','calls','weeklyCalls'],
  ['Events','events','weeklyEvents'],
  ['Videos / Posts / Blasts','content','weeklyContent'],
  ['Thank-You Cards','cards','weeklyCards'],
] as const

const monthly = [
  ['New Realtors','newRealtors','monthlyRealtors'],
  ['Offices / Teams','newOffices','monthlyOffices'],
  ['VIPs','newVips','monthlyVips'],
  ['Gifts','gifts','monthlyGifts'],
] as const

const keys = ['face','bread','calls','events','content','cards','gifts','newRealtors','newOffices','newVips','leads','deals'] as const

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0,0,0,0)
  return x
}
function endOfWeek(d: Date) {
  const x = startOfWeek(d)
  x.setDate(x.getDate()+6)
  x.setHours(23,59,59,999)
  return x
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1) }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999) }
function inRange(row: ActivityEntry, a: Date, b: Date) {
  const d = new Date(row.date+'T12:00:00')
  return d>=a && d<=b
}
function aggregate(rows: ActivityEntry[]) {
  const out: Record<string,number> = {}
  keys.forEach(k=>out[k]=0)
  rows.forEach(r=>keys.forEach(k=>out[k]+=Number(r[k]||0)))
  return out
}
function businessPlan(s: EngineSettings) {
  const revenue = s.compType === 'flat' ? Number(s.compFlat) : Number(s.avgLoan)*(Number(s.compBps)/10000)
  const loansYear = revenue > 0 ? Number(s.annualIncome)/revenue : 0
  const leadsYear = loansYear / Math.max(.01, Number(s.conversion)/100)
  return { loansYear, loansMonth:loansYear/12, leadsMonth:leadsYear/12, leadsWeek:leadsYear/Math.max(1,Number(s.workingWeeks)) }
}
function themeForToday(s: EngineSettings, d: Date) {
  const map: Record<number,[string,string,string,string]> = {
    1:['Monday','monTheme','monAm','monPm'],
    2:['Tuesday','tueTheme','tueAm','tuePm'],
    3:['Wednesday','wedTheme','wedAm','wedPm'],
    4:['Thursday','thuTheme','thuAm','thuPm'],
    5:['Friday','friTheme','friAm','friPm'],
  }
  const row = map[d.getDay()]
  if (!row) return {day:d.getDay()===0?'Sunday':'Saturday',theme:'FLEX / PERSONAL DAY',am:'No Theme Day configured.',pm:'Use as needed.'}
  return {day:row[0],theme:String(s[row[1] as keyof EngineSettings]),am:String(s[row[2] as keyof EngineSettings]),pm:String(s[row[3] as keyof EngineSettings])}
}

export default function OriginatorEngineDashboard() {
  const [settings,setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS)
  const [activity,setActivity] = useState<ActivityEntry[]>([])

  useEffect(()=>{
    let cancelled = false

    async function load() {
      const [settingsRes, activityRes] = await Promise.all([
        fetch('/api/originator-engine/settings', { cache: 'no-store' }),
        fetch('/api/originator-engine/activity', { cache: 'no-store' }),
      ])

      if (cancelled) return

      if (settingsRes.ok) {
        const body = await settingsRes.json()
        setSettings({ ...DEFAULT_SETTINGS, ...(body.settings ?? {}) })
      }

      if (activityRes.ok) {
        const body = await activityRes.json()
        setActivity(body.activity ?? [])
      }
    }

    load()
    return () => { cancelled = true }
  },[])

  const now = useMemo(()=>new Date(),[])
  const plan = businessPlan(settings)
  const weekRows = activity.filter(r=>inRange(r,startOfWeek(now),endOfWeek(now)))
  const monthRows = activity.filter(r=>inRange(r,startOfMonth(now),endOfMonth(now)))
  const todayRows = activity.filter(r=>r.date===now.toISOString().slice(0,10))
  const week = aggregate(weekRows)
  const month = aggregate(monthRows)
  const today = aggregate(todayRows)
  const activeTargets = weekly.map(([label,key,goal])=>({label,key,goal:Number(settings[goal])})).filter(x=>x.goal>0)
  const completeCount = activeTargets.filter(x=>week[x.key]>=x.goal).length
  const theme = themeForToday(settings,now)

  return (
    <main className="mx-auto max-w-[1220px] p-[22px] text-[#1f2937]">
      <OriginatorEngineNav />

      <div className="mb-[18px] flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Activity & Accountability Engine</div>
          <h1 className="mt-1 text-[30px]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#6b7280]">{now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}</p>
        </div>
        <Link href="/originator-engine/activity" className="rounded-[10px] bg-[#1f4b7a] px-4 py-3 text-sm font-bold text-white">+ Enter Activity</Link>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Annual Income Goal', '$'+Number(settings.annualIncome).toLocaleString(), '$'+Math.round(Number(settings.annualIncome)/12).toLocaleString()+' / month'],
          ['Loans Needed', plan.loansMonth.toFixed(1), plan.loansYear.toFixed(1)+' / year'],
          ['Leads Needed', plan.leadsMonth.toFixed(1), 'per month'],
          ['Weekly Lead Pace', plan.leadsWeek.toFixed(1), 'from business plan'],
        ].map(([k,v,s])=>(
          <div key={k} className="rounded-[14px] border border-[#d8dee8] bg-white p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{k}</div>
            <div className="mt-1 text-2xl font-extrabold">{v}</div>
            <div className="mt-1 text-[11px] text-[#6b7280]">{s}</div>
          </div>
        ))}
      </div>

      <section className="mb-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="mb-4 flex flex-wrap justify-between gap-4">
          <div><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Today</div><div className="text-xl font-extrabold">Theme Day</div></div>
          <div className="max-w-[500px] text-right text-xs text-[#6b7280]">The Dashboard is the scoreboard. Activity entry lives on its own dedicated page.</div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[14px] border border-[#bfd0df] bg-[#f7fbff] p-4">
            <div className="flex justify-between gap-4"><span className="text-sm font-bold text-[#6b7280]">{theme.day}</span><span className="text-[10px] text-[#6b7280]">This Week</span></div>
            <div className="my-2 text-2xl font-black">{theme.theme}</div>
            <div className="grid gap-3 md:grid-cols-2">
              <Focus title="A.M. Focus" copy={theme.am} />
              <Focus title="P.M. Focus" copy={theme.pm} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <Mini label="Face-to-Face Today" value={today.face} />
              <Mini label="Great Calls Today" value={today.calls} />
              <Mini label="Leads Today" value={today.leads} />
            </div>
          </div>
          <div className="rounded-[14px] border border-[#d8dee8] p-4">
            <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Greatness Streak</div>
            <div className="mt-1 text-[31px] font-black">🔥 0 Weeks</div>
            <div className="text-[11px] text-[#6b7280]">Activity and settings are saved to your LG Toolbox account.</div>
            <div className="mt-4 rounded-[10px] bg-[#eef4fa] p-3">
              <div className="text-[13px] font-extrabold">{completeCount===activeTargets.length && activeTargets.length ? '✅ Greatness Week Complete' : `This Week: ${completeCount} of ${activeTargets.length} targets complete`}</div>
              <div className="mt-1 text-[11px] text-[#6b7280]">Complete every active weekly target to earn a Greatness Week.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
          <div className="mb-4"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Originator Engine</div><div className="text-xl font-extrabold">This Week</div></div>
          {activeTargets.map(t=>{
            const pct=Math.min(100,Math.round((week[t.key]/t.goal)*100))
            return <div key={t.key} className="mb-3 grid grid-cols-[150px_1fr_72px] items-center gap-3">
              <div className="text-[13px] font-bold">{t.label}</div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#e9edf2]"><div className="h-full rounded-full bg-[#1f4b7a]" style={{width:pct+'%'}} /></div>
              <div className="text-right text-xs font-extrabold">{week[t.key]} / {t.goal}</div>
            </div>
          })}
        </section>

        <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
          <div className="mb-4"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">New Business Development</div><div className="text-xl font-extrabold">This Month</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {monthly.map(([label,key,goal])=>(
              <div key={key} className="rounded-xl border border-[#d8dee8] p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{label}</div>
                <div className="mt-1 text-xl font-extrabold">{month[key]} / {Number(settings[goal])}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="mb-4"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Results</div><div className="text-xl font-extrabold">Leads & Deals</div></div>
        <div className="grid gap-3 md:grid-cols-4">
          <Mini label="Weekly Leads" value={week.leads} />
          <Mini label="Weekly Deals" value={week.deals} />
          <Mini label="Monthly Leads" value={month.leads} />
          <Mini label="Monthly Deals" value={month.deals} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="mb-4"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Activity Feed</div><div className="text-xl font-extrabold">What Happened This Week</div></div>
        {weekRows.length===0 ? <p className="text-sm text-[#6b7280]">No activity logged this week.</p> :
          <div className="space-y-2">{[...weekRows].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(row=>
            <div key={row.id} className="rounded-xl border border-[#d8dee8] p-3">
              <div className="text-[13px] font-extrabold">{row.title || 'Activity Entry'}</div>
              <div className="text-[10px] text-[#6b7280]">{row.date} · {row.category}</div>
              {row.note && <div className="mt-1 text-xs text-[#6b7280]">{row.note}</div>}
            </div>
          )}</div>}
      </section>
    </main>
  )
}

function Focus({title,copy}:{title:string,copy:string}) {
  return <div className="rounded-[10px] border border-[#d8dee8] bg-white p-3"><div className="mb-1 text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{title}</div><div className="whitespace-pre-line text-[13px] leading-relaxed">{copy}</div></div>
}
function Mini({label,value}:{label:string,value:number}) {
  return <div className="rounded-[10px] bg-[#f7f9fb] p-3"><div className="text-[10px] font-extrabold uppercase tracking-[.07em] text-[#6b7280]">{label}</div><div className="mt-1 text-lg font-extrabold">{value}</div></div>
}
