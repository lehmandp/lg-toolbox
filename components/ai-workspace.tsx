'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
type Message={role:'user'|'assistant';content:string}
type Project={id:string;name:string;mode:string;messages:Message[]}
const assistants=[{name:'Originator Coach',description:'Daily planning, activity and accountability',icon:'◎'},{name:'Business Advisor',description:'Production strategy and referral relationships',icon:'▤'},{name:'Marketing',description:'Campaigns, emails and outreach',icon:'✦'},{name:'Lending Guidelines',description:'Mortgage program research',icon:'▣'}]
export default function AIWorkspace() {
 const [projects,setProjects]=useState<Project[]>([])
 const [selected,setSelected]=useState<string|null>(null)
 const [mode,setMode]=useState('Originator Coach')
 const [input,setInput]=useState('')
 const [connected,setConnected]=useState(false)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 useEffect(()=>{fetch('/api/ai/settings').then(r=>r.json()).then(x=>setConnected(x.connected===true)).catch(()=>setError('Unable to load AI settings'))},[])
 const active=projects.find(p=>p.id===selected)
 function newProject(m=mode) {
  const name=window.prompt('Project name',m+' project')
  if(!name?.trim())return
  const id=crypto.randomUUID()
  setProjects(current=>[{id,name:name.trim().slice(0,80),mode:m,messages:[]},...current])
  setSelected(id);setMode(m);setInput('')
 }
 async function send(){
  if(!active||!connected||!input.trim()||busy)return
  const message=input.trim()
  const next:Message[]=[...active.messages,{role:'user',content:message}]
  setProjects(ps=>ps.map(p=>p.id===active.id?{...p,messages:next}:p));setInput('');setBusy(true);setError('')
  try{
   const res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:active.mode==='Marketing'?'Marketing':active.mode,messages:next.slice(-16)})})
   const data=await res.json();if(!res.ok)throw new Error(data.error||'Unable to respond')
   setProjects(ps=>ps.map(p=>p.id===active.id?{...p,messages:[...next,{role:'assistant',content:data.reply}]}:p))
  }catch(e){setError(e instanceof Error?e.message:'Unable to respond')}finally{setBusy(false)}
 }
 return <main className="mx-auto max-w-[1200px] px-6 py-10">
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="eyebrow mb-2">FEATURED NATIVE TOOL</div><h1>Toolbox AI</h1><p className="mt-2 text-sm text-muted-foreground">Four specialties. One assistant for your mortgage business.</p></div><Link className="btn-secondary" href="/settings">AI & Profile Settings →</Link></div>
  {!connected&&<div className="mb-5 border border-primary bg-[#eee9e4] p-4 text-sm">Connect your personal OpenAI API key in <Link href="/settings" className="font-semibold underline">Settings</Link> to begin chatting.</div>}
  <div className="grid min-h-[610px] gap-5 lg:grid-cols-[255px_1fr]">
   <aside className="border border-border bg-white p-4"><div className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">Assistant modes</div><div className="space-y-2">{assistants.map(a=><button key={a.name} onClick={()=>{setMode(a.name);setSelected(null)}} className={'w-full border p-3 text-left transition-colors '+(mode===a.name?'border-primary bg-[#eee9e4]':'border-border hover:border-primary')}><span className="mr-2 text-primary">{a.icon}</span><span className="text-sm font-medium">{a.name}</span><span className="mt-1 block text-[11px] text-muted-foreground">{a.description}</span></button>)}</div>
   <div className="my-5 border-t border-border"/><div className="mb-3 flex items-center justify-between"><strong className="text-xs">Projects</strong><button className="text-xs text-primary" onClick={()=>newProject()}>+ New</button></div>
   {projects.filter(p=>p.mode===mode).map(p=><button key={p.id} onClick={()=>setSelected(p.id)} className={'mb-1 block w-full truncate p-2 text-left text-xs '+(selected===p.id?'bg-[#eee9e4] text-primary':'hover:bg-[#f5f5f5]')}>▤ {p.name}</button>)}
   <p className="mt-5 text-[10px] leading-relaxed text-muted-foreground">Beta projects are kept in this page only and disappear when reloaded. Persistent project storage is part of the next integration.</p></aside>
   <section className="flex min-h-[590px] flex-col border border-border bg-white">
    {!active?<div className="flex flex-1 flex-col items-center justify-center p-8 text-center"><div className="mb-4 text-4xl text-primary">✦</div><h2>{mode}</h2><p className="mt-3 max-w-md text-sm text-muted-foreground">Choose a project to resume work or create a new project. Your assistant uses the selected specialty's coaching focus.</p><button className="btn-primary mt-6" onClick={()=>newProject()}>+ Create a project</button></div>:
    <><div className="border-b border-border px-5 py-4"><div className="eyebrow mb-1">{active.mode}</div><h3 className="text-lg">{active.name}</h3></div><div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">{active.messages.length===0&&<p className="text-sm text-muted-foreground">What's the first thing we should work on?</p>}{active.messages.map((m,i)=><div key={i} className={'max-w-[92%] whitespace-pre-wrap p-4 text-sm '+(m.role==='user'?'ml-auto bg-[#eee9e4]':'border-l-2 border-primary bg-[#f5f5f5]')}>{m.content}</div>)}{busy&&<p className="text-xs text-muted-foreground">Thinking…</p>}</div>{error&&<p role="alert" className="px-5 text-xs text-red-700">{error}</p>}<form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2 border-t border-border p-4"><input aria-label="Message" className="min-w-0 flex-1 border border-border-input px-3 py-3 text-sm" placeholder="Ask Toolbox AI…" value={input} onChange={e=>setInput(e.target.value)}/><button className="btn-primary" type="submit" disabled={!connected||busy||!input.trim()}>Send</button></form></>}
   </section>
  </div>
 </main>
}
