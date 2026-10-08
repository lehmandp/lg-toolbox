'use client'

import { useEffect, useMemo, useState } from 'react'
import OriginatorEngineNav from './nav'
import { DEFAULT_SETTINGS, emptyActivity, type ActivityEntry, type EngineSettings } from './storage'

const checks = [
  ['face','Face-to-Face'],
  ['bread','Break Bread'],
  ['calls','Great Call'],
  ['events','Event'],
  ['content','Video / Post / Blast'],
  ['cards','Thank-You Card'],
  ['gifts','Gift'],
  ['newRealtors','New Realtor'],
  ['newOffices','New Office / Team'],
  ['newVips','New VIP'],
  ['leads','Lead Produced'],
  ['deals','Deal Produced'],
] as const

const summaryMetrics = [
  ['face','Face-to-Face'],
  ['bread','Break Bread'],
  ['calls','Great Calls'],
  ['events','Events'],
  ['content','Videos / Posts / Blasts'],
  ['cards','Thank-You Cards'],
  ['gifts','Gifts'],
  ['newRealtors','New Realtors'],
  ['newOffices','New Offices / Teams'],
  ['newVips','New VIPs'],
  ['leads','Leads'],
  ['deals','Deals'],
] as const

function aggregate(rows: ActivityEntry[]) {
  const totals: Record<string,number> = {}
  summaryMetrics.forEach(([key])=>totals[key]=0)
  rows.forEach(row=>summaryMetrics.forEach(([key])=>totals[key]+=Number(row[key]||0)))
  return totals
}

function prettyDate(date:string) {
  return new Date(date+'T12:00:00').toLocaleDateString('en-US',{
    weekday:'long', month:'long', day:'numeric', year:'numeric'
  })
}

export default function OriginatorEngineActivity() {
  const [rows,setRows] = useState<ActivityEntry[]>([])
  const [settings,setSettings] = useState<EngineSettings>(DEFAULT_SETTINGS)
  const [mode,setMode] = useState<'individual'|'bulk'>('individual')
  const [form,setForm] = useState<ActivityEntry>(emptyActivity())
  const [saved,setSaved] = useState(false)
  const [noteSaved,setNoteSaved] = useState(false)
  const [dailyNote,setDailyNote] = useState('')

  useEffect(()=>{
    let cancelled = false

    Promise.all([
      fetch('/api/originator-engine/activity', { cache: 'no-store' }),
      fetch('/api/originator-engine/settings', { cache: 'no-store' }),
    ]).then(async ([activityRes, settingsRes])=>{
      if (cancelled) return

      if (activityRes.ok) {
        const body = await activityRes.json()
        setRows(body.activity ?? [])
      }

      if (settingsRes.ok) {
        const body = await settingsRes.json()
        const next = { ...DEFAULT_SETTINGS, ...(body.settings ?? {}) }
        setSettings(next)
        setDailyNote(next.dailyNotes?.[form.date] ?? '')
      }
    }).catch(()=>{})

    return () => { cancelled = true }
  },[])

  useEffect(()=>{
    setDailyNote(settings.dailyNotes?.[form.date] ?? '')
  },[form.date, settings.dailyNotes])

  const dailyGroups = useMemo(()=>{
    const map = new Map<string,ActivityEntry[]>()
    rows.forEach(row=>{
      const current = map.get(row.date) ?? []
      current.push(row)
      map.set(row.date,current)
    })

    Object.keys(settings.dailyNotes ?? {}).forEach(date=>{
      if (!map.has(date) && settings.dailyNotes[date]?.trim()) map.set(date,[])
    })

    return [...map.entries()]
      .sort(([a],[b])=>b.localeCompare(a))
      .map(([date,entries])=>({
        date,
        entries:[...entries].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),
        totals:aggregate(entries),
        note:settings.dailyNotes?.[date] ?? '',
      }))
  },[rows,settings.dailyNotes])

  function update<K extends keyof ActivityEntry>(key:K,value:ActivityEntry[K]) {
    setForm(f=>({...f,[key]:value}))
  }

  async function save() {
    const payload = {
      ...form,
      type: mode,
      title: mode==='bulk' ? (form.title || 'Bulk Activity') : form.title,
    }

    const res = await fetch('/api/originator-engine/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) return

    const body = await res.json()
    setRows((current)=>[body.entry as ActivityEntry, ...current])
    const keepDate = form.date
    setForm({...emptyActivity(),date:keepDate})
    setSaved(true)
    setTimeout(()=>setSaved(false),1800)
  }

  async function saveDailyNote() {
    const nextNotes = { ...(settings.dailyNotes ?? {}) }
    if (dailyNote.trim()) nextNotes[form.date] = dailyNote.trim()
    else delete nextNotes[form.date]

    const next = { ...settings, dailyNotes: nextNotes }
    const res = await fetch('/api/originator-engine/settings', {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({settings:next}),
    })

    if (!res.ok) return
    setSettings(next)
    setNoteSaved(true)
    setTimeout(()=>setNoteSaved(false),1800)
  }

  return (
    <main className="mx-auto max-w-[1100px] p-[22px] text-[#1f2937]">
      <OriginatorEngineNav />
      <div className="mb-[18px]">
        <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Activity Entry</div>
        <h1 className="mt-1 text-[30px]">Enter Activity</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Log activity as it happens. Originator Engine rolls every entry into a daily summary automatically.</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={()=>setMode('individual')} className={tab(mode==='individual')}>Individual Interaction</button>
        <button onClick={()=>setMode('bulk')} className={tab(mode==='bulk')}>Bulk Activity</button>
      </div>

      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={mode==='individual'?'Person / Activity':'Activity / List'}>
            <input className={input} value={form.title} onChange={e=>update('title',e.target.value)} placeholder={mode==='individual'?'Sarah Smith — Agent Call':'Monday Realtor Call List'} />
          </Field>
          <Field label="Date">
            <input type="date" className={input} value={form.date} onChange={e=>update('date',e.target.value)} />
          </Field>
        </div>

        {mode==='individual' && (
          <Field label="Category">
            <select className={input} value={form.category} onChange={e=>update('category',e.target.value)}>
              {['Realtor','Referral Partner / VIP','Client','Past Client','Lead','Office / Team','Other'].map(x=><option key={x}>{x}</option>)}
            </select>
          </Field>
        )}

        <div className="mt-5">
          <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">{mode==='individual'?'What should this interaction count toward?':'Activity Counts'}</div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map(([key,label])=>(
              mode==='individual'
                ? <button key={key} type="button" onClick={()=>update(key,(form[key] ? 0 : 1) as never)} className={'rounded-xl border px-3 py-3 text-left text-sm font-bold '+(form[key]?'border-[#1f4b7a] bg-[#eef4fa] text-[#1f4b7a]':'border-[#d8dee8] bg-white')}>
                    {form[key]?'✓ ':''}{label}
                  </button>
                : <label key={key} className="rounded-xl border border-[#d8dee8] p-3">
                    <span className="mb-1 block text-[11px] font-bold text-[#6b7280]">{label}</span>
                    <input type="number" min="0" className={input} value={Number(form[key])} onChange={e=>update(key,Number(e.target.value) as never)} />
                  </label>
            ))}
          </div>
        </div>

        <Field label="Interaction Notes (optional)">
          <textarea className={input+' min-h-[90px]'} value={form.note} onChange={e=>update('note',e.target.value)} placeholder="Optional detail for this specific entry." />
        </Field>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} className="rounded-[10px] bg-[#1f4b7a] px-5 py-3 text-sm font-bold text-white">Save Activity</button>
          {saved && <span className="text-sm font-bold text-[#315d36]">Saved.</span>}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#bfd0df] bg-[#f7fbff] p-[18px]">
        <div className="mb-2">
          <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Daily Notes</div>
          <div className="text-xl font-extrabold">{prettyDate(form.date)}</div>
        </div>
        <p className="mb-3 text-xs leading-5 text-[#6b7280]">
          Keep a simple journal of the day — who you talked to, what you discussed, or anything worth remembering. Your CRM can keep the contact details.
        </p>
        <textarea
          className={input+' min-h-[110px]'}
          value={dailyNote}
          onChange={e=>setDailyNote(e.target.value)}
          placeholder="Talked with Sarah Smith. Discussed her new listing and VA buyers. She was open to using me as a backup VA resource..."
        />
        <div className="mt-3 flex items-center gap-3">
          <button onClick={saveDailyNote} className="rounded-[10px] border border-[#1f4b7a] bg-white px-4 py-2.5 text-sm font-bold text-[#1f4b7a]">Save Daily Notes</button>
          {noteSaved && <span className="text-sm font-bold text-[#315d36]">Saved.</span>}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="mb-4">
          <div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Archive</div>
          <div className="text-xl font-extrabold">Daily Activity</div>
          <p className="mt-1 text-xs text-[#6b7280]">Each day is summarized below. Expand a day if you need to see the individual entries.</p>
        </div>

        {dailyGroups.length===0 ? <p className="text-sm text-[#6b7280]">No activity logged yet.</p> :
          <div className="space-y-3">
            {dailyGroups.map(group=>(
              <details key={group.date} className="rounded-xl border border-[#d8dee8] bg-white">
                <summary className="cursor-pointer list-none p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold">{prettyDate(group.date)}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {summaryMetrics.filter(([key])=>group.totals[key]>0).map(([key,label])=>(
                          <span key={key} className="rounded-[8px] bg-[#eef4fa] px-2.5 py-1 text-[11px] font-bold text-[#1f4b7a]">
                            {group.totals[key]} {label}
                          </span>
                        ))}
                        {group.entries.length===0 && <span className="text-xs text-[#6b7280]">Notes only</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#6b7280]">{group.entries.length} {group.entries.length===1?'entry':'entries'} · View details ↓</span>
                  </div>
                  {group.note && (
                    <div className="mt-3 rounded-[10px] bg-[#f7f9fb] p-3 text-xs leading-5 text-[#4b5563]">
                      <span className="font-extrabold">Daily Notes: </span>{group.note}
                    </div>
                  )}
                </summary>

                <div className="border-t border-[#d8dee8] px-4 py-3">
                  {group.entries.length===0 ? <p className="text-xs text-[#6b7280]">No individual activity entries for this day.</p> :
                    <div className="space-y-2">
                      {group.entries.map(r=>(
                        <div key={r.id} className="rounded-[10px] border border-[#e3e7ed] p-3">
                          <div className="text-sm font-extrabold">{r.title||'Activity Entry'}</div>
                          <div className="text-[11px] text-[#6b7280]">{r.category}</div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {summaryMetrics.filter(([key])=>Number(r[key])>0).map(([key,label])=>(
                              <span key={key} className="rounded-[7px] bg-[#f1f3f5] px-2 py-1 text-[10px] font-bold text-[#4b5563]">{Number(r[key])} {label}</span>
                            ))}
                          </div>
                          {r.note&&<div className="mt-2 text-xs leading-5 text-[#6b7280]">{r.note}</div>}
                        </div>
                      ))}
                    </div>
                  }
                </div>
              </details>
            ))}
          </div>
        }
      </section>
    </main>
  )
}

const input='w-full rounded-[10px] border border-[#d8dee8] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1f4b7a]'
function Field({label,children}:{label:string,children:React.ReactNode}) {
  return <label className="mt-4 block"><span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[.06em] text-[#6b7280]">{label}</span>{children}</label>
}
function tab(active:boolean) {
  return 'rounded-[10px] px-4 py-2.5 text-sm font-extrabold '+(active?'bg-[#1f4b7a] text-white':'border border-[#d8dee8] bg-white text-[#1f2937]')
}
