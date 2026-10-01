'use client'

import { useEffect, useState } from 'react'
import OriginatorEngineNav from './nav'
import { emptyActivity, readActivity, writeActivity, type ActivityEntry } from './storage'

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

export default function OriginatorEngineActivity() {
  const [rows,setRows] = useState<ActivityEntry[]>([])
  const [mode,setMode] = useState<'individual'|'bulk'>('individual')
  const [form,setForm] = useState<ActivityEntry>(emptyActivity())
  const [saved,setSaved] = useState(false)

  useEffect(()=>setRows(readActivity()),[])

  function update<K extends keyof ActivityEntry>(key:K,value:ActivityEntry[K]) {
    setForm(f=>({...f,[key]:value}))
  }

  function save() {
    const next:ActivityEntry = {
      ...form,
      id: crypto.randomUUID(),
      type: mode,
      createdAt: new Date().toISOString(),
      title: mode==='bulk' ? (form.title || 'Bulk Activity') : form.title,
    }
    const all=[next,...rows]
    setRows(all)
    writeActivity(all)
    setForm(emptyActivity())
    setSaved(true)
    setTimeout(()=>setSaved(false),1800)
  }

  return (
    <main className="mx-auto max-w-[1100px] p-[22px] text-[#1f2937]">
      <OriginatorEngineNav />
      <div className="mb-[18px]">
        <div className="text-xs font-extrabold uppercase tracking-[.14em] text-[#6b7280]">Activity Entry</div>
        <h1 className="mt-1 text-[30px]">Enter Activity</h1>
        <p className="mt-1 text-sm text-[#6b7280]">Log the work. One interaction can count toward multiple categories when appropriate.</p>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={()=>setMode('individual')} className={tab(mode==='individual')}>Individual Interaction</button>
        <button onClick={()=>setMode('bulk')} className={tab(mode==='bulk')}>Bulk Activity</button>
      </div>

      <section className="rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={mode==='individual'?'Person / Activity':'Activity / List'}>
            <input className={input} value={form.title} onChange={e=>update('title',e.target.value)} placeholder={mode==='individual'?'Sarah Davis — Coffee Meeting':'Monday Realtor Call List'} />
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

        <Field label="Notes">
          <textarea className={input+' min-h-[100px]'} value={form.note} onChange={e=>update('note',e.target.value)} placeholder="Coffee at Lofty. Discussed VA buyer seminar and upcoming listing." />
        </Field>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} className="rounded-[10px] bg-[#1f4b7a] px-5 py-3 text-sm font-bold text-white">Save Activity</button>
          {saved && <span className="text-sm font-bold text-[#315d36]">Saved.</span>}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#d8dee8] bg-white p-[18px]">
        <div className="mb-3"><div className="text-[10px] font-extrabold uppercase tracking-[.08em] text-[#6b7280]">Recent</div><div className="text-xl font-extrabold">Latest Entries</div></div>
        {rows.length===0 ? <p className="text-sm text-[#6b7280]">No activity logged yet.</p> :
          <div className="space-y-2">{rows.slice(0,8).map(r=><div key={r.id} className="rounded-xl border border-[#d8dee8] p-3"><div className="text-sm font-extrabold">{r.title||'Activity Entry'}</div><div className="text-[11px] text-[#6b7280]">{r.date} · {r.category}</div>{r.note&&<div className="mt-1 text-xs text-[#6b7280]">{r.note}</div>}</div>)}</div>}
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
