'use client'

import { useEffect, useMemo, useState } from 'react'
import OriginatorEngineNav from './nav'
import { ACTIVITY_KEY, DEFAULT_SETTINGS, SETTINGS_KEY, type EngineSettings } from './storage'

const weekly = [
  ['Face-to-Face','weeklyFace'],['Break Bread','weeklyBread'],['Great Calls','weeklyCalls'],
  ['Events','weeklyEvents'],['Videos / Posts / Blasts','weeklyContent'],['Thank-You Cards','weeklyCards']
] as const
const monthly = [
  ['New Realtors','monthlyRealtors'],['Agent Offices / Teams','monthlyOffices'],['VIPs','monthlyVips'],['Gifts','monthlyGifts']
] as const

export default function OriginatorEngineSettings() {
  const [s,setS] = useState<EngineSettings>(DEFAULT_SETTINGS)
  const [saved,setSaved] = useState(false)
  const [resetting,setResetting] = useState(false)
  const [resetError,setResetError] = useState<string | null>(null)

  useEffect(()=>{
    let cancelled = false
    fetch('/api/originator-engine/settings', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load settings.')
        const body = await res.json()
        if (!cancelled) setS({ ...DEFAULT_SETTINGS, ...(body.settings ?? {}) })
      })
      .catch(() => {})
    return () => { cancelled = true }
  },[])

  const plan = useMemo(()=>{
    const rev=s.compType==='flat'?Number(s.compFlat):Number(s.avgLoan)*(Number(s.compBps)/10000)
    const loansYear=rev>0?Number(s.annualIncome)/rev:0
    const leadsYear=loansYear/Math.max(.01,Number(s.conversion)/100)
    return {rev,loansYear,loansMonth:loansYear/12,leadsYear,leadsMonth:leadsYear/12,leadsWeek:leadsYear/Math.max(1,Number(s.workingWeeks))}
  },[s])

  function update(key:keyof EngineSettings,value:string|number) {
    setS(prev=>({...prev,[key]:value}))
  }
  async function save() {
    const res = await fetch('/api/originator-engine/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: s }),
    })
    if (!res.ok) return
    setSaved(true)
    setTimeout(()=>setSaved(false),1800)
  }

  async function startOver() {
    const confirmed = window.confirm(
      'Start over with Originator Engine?\n\nThis will permanently delete all activity history and restore your business plan, goals, and Theme Days to the original defaults. This cannot be undone.'
    )
    if (!confirmed) return

    setResetting(true)
    setResetError(null)

    try {
      const res = await fetch('/api/originator-engine/reset', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not reset Originator Engine.')

      // Clear any legacy browser-saved Originator Engine data as well.
      localStorage.removeItem(SETTINGS_KEY)
      localStorage.removeItem(ACTIVITY_KEY)

      window.location.href = '/originator-engine'
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'Could not reset Originator Engine.')
      setResetting(false)
    }
  }

  return (
    <main className="mx-auto max-w-[1100px] p-[22px] text-[#1f2937]">
      <OriginatorEngineNav />
      <div className="mb-[18px]">
        <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Business Planning</div>
        <h1 className="mt-1 text-[30px]">Business Plan & Settings</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Define the business you want, then set the weekly and monthly standards that support it.</p>
      </div>

      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Header kicker="Business Plan" title="Production Goal" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Annual Income Goal" value={s.annualIncome} onChange={v=>update('annualIncome',v)} prefix="$" />
          <NumberField label="Average Loan Amount" value={s.avgLoan} onChange={v=>update('avgLoan',v)} prefix="$" />
          <label><Label>Compensation Type</Label><select className={input} value={s.compType} onChange={e=>update('compType',e.target.value)}><option value="bps">Basis Points</option><option value="flat">Flat $ / Loan</option></select></label>
          {s.compType==='bps'
            ? <NumberField label="Compensation (bps)" value={s.compBps} onChange={v=>update('compBps',v)} />
            : <NumberField label="Flat Compensation" value={s.compFlat} onChange={v=>update('compFlat',v)} prefix="$" />}
          <NumberField label="Lead-to-Close Conversion %" value={s.conversion} onChange={v=>update('conversion',v)} />
          <NumberField label="Working Weeks" value={s.workingWeeks} onChange={v=>update('workingWeeks',v)} />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Metric label="Revenue / Loan" value={'$'+Math.round(plan.rev).toLocaleString()} />
          <Metric label="Loans / Year" value={plan.loansYear.toFixed(1)} />
          <Metric label="Loans / Month" value={plan.loansMonth.toFixed(1)} />
          <Metric label="Leads / Year" value={plan.leadsYear.toFixed(0)} />
          <Metric label="Leads / Month" value={plan.leadsMonth.toFixed(1)} />
          <Metric label="Leads / Week" value={plan.leadsWeek.toFixed(1)} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Header kicker="Weekly Standard" title="Greatness Week" />
        <p className="mb-4 text-xs text-[#6b7280]">A Greatness Week is complete only when every active weekly target is met or exceeded. Set a target to 0 to exclude it.</p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weekly.map(([label,key])=><NumberField key={key} label={label} value={Number(s[key])} onChange={v=>update(key,v)} />)}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Header kicker="Monthly Standard" title="New Business Development" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {monthly.map(([label,key])=><NumberField key={key} label={label} value={Number(s[key])} onChange={v=>update(key,v)} />)}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <Header kicker="Weekly Rhythm" title="Theme Days" />
        <div className="space-y-3">
          {[
            ['Monday','monTheme','monAm','monPm'],['Tuesday','tueTheme','tueAm','tuePm'],['Wednesday','wedTheme','wedAm','wedPm'],
            ['Thursday','thuTheme','thuAm','thuPm'],['Friday','friTheme','friAm','friPm']
          ].map(([day,theme,am,pm])=>(
            <div key={day} className="grid gap-3 rounded-xl border border-[#d8dee8] p-3 lg:grid-cols-[140px_1fr_1fr_1fr]">
              <div className="text-sm font-extrabold">{day}</div>
              <TextField label="Theme" value={String(s[theme as keyof EngineSettings])} onChange={v=>update(theme as keyof EngineSettings,v)} />
              <TextArea label="A.M. Focus" value={String(s[am as keyof EngineSettings])} onChange={v=>update(am as keyof EngineSettings,v)} />
              <TextArea label="P.M. Focus" value={String(s[pm as keyof EngineSettings])} onChange={v=>update(pm as keyof EngineSettings,v)} />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} className="rounded-[10px] bg-[#1f4b7a] px-5 py-3 text-sm font-bold text-white">Save Business Plan & Settings</button>
        <button onClick={()=>setS(DEFAULT_SETTINGS)} className="rounded-[10px] border border-[#d8dee8] bg-white px-5 py-3 text-sm font-bold">Restore Default Settings</button>
        {saved && <span className="text-sm font-bold text-[#315d36]">Saved.</span>}
      </div>

      <section className="mt-8 rounded-2xl border border-[#e0b4b4] bg-[#fffafa] p-[18px]">
        <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#9b3a3a]">Danger Zone</div>
        <div className="mt-1 text-xl font-extrabold">Start Over</div>
        <p className="mt-2 max-w-[760px] text-sm leading-6 text-[#6b7280]">
          Permanently delete all Originator Engine activity history and restore your business plan,
          goals, weekly standards, monthly standards, and Theme Days to the original defaults.
          This does not affect your LG Loan Toolbox account or any other tool.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={startOver}
            disabled={resetting}
            className="rounded-[10px] border border-[#b44a4a] bg-white px-5 py-3 text-sm font-bold text-[#9b3a3a] disabled:opacity-50"
          >
            {resetting ? 'Resetting…' : 'Reset Originator Engine'}
          </button>
          {resetError && <span className="text-sm font-bold text-[#9b3a3a]">{resetError}</span>}
        </div>
      </section>
    </main>
  )
}

const input='w-full rounded-[10px] border border-[#d8dee8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f4b7a]'
function Label({children}:{children:React.ReactNode}) { return <span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{children}</span> }
function NumberField({label,value,onChange,prefix}:{label:string,value:number,onChange:(v:number)=>void,prefix?:string}) {
  return <label><Label>{label}</Label><div className="flex items-center rounded-[10px] border border-[#d8dee8] bg-white px-3">{prefix&&<span className="mr-1 text-sm text-[#6b7280]">{prefix}</span>}<input type="number" className="w-full bg-transparent py-2.5 text-sm outline-none" value={value} onChange={e=>onChange(Number(e.target.value))} /></div></label>
}
function TextField({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}) {
  return <label><Label>{label}</Label><input className={input} value={value} onChange={e=>onChange(e.target.value)} /></label>
}
function TextArea({label,value,onChange}:{label:string,value:string,onChange:(v:string)=>void}) {
  return <label><Label>{label}</Label><textarea className={input+' min-h-[78px]'} value={value} onChange={e=>onChange(e.target.value)} /></label>
}
function Metric({label,value}:{label:string,value:string}) { return <div className="rounded-xl bg-[#f7f9fb] p-3"><div className="text-[9px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</div><div className="mt-1 text-lg font-extrabold">{value}</div></div> }
function Header({kicker,title}:{kicker:string,title:string}) { return <div className="mb-4"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">{kicker}</div><div className="text-xl font-extrabold">{title}</div></div> }
