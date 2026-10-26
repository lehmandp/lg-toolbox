'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
type Message={role:'user'|'assistant';content:string}
type Context='Originator Engine'|'Realtor Partner Engine'
export default function EngineAIWidget({context}:{context:Context}){
 const mode=context==='Originator Engine'?'Originator Coach':'Business Advisor'
 const bottomRef=useRef<HTMLDivElement|null>(null)
 const [open,setOpen]=useState(false)
 const [connected,setConnected]=useState<boolean|null>(null)
 const [chatId,setChatId]=useState<string|null>(null)
 const [messages,setMessages]=useState<Message[]>([])
 const [input,setInput]=useState('')
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [useData,setUseData]=useState(false)
 useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth',block:'end'})},[messages,busy,open])
 useEffect(()=>{if(!open)return;fetch('/api/ai/settings').then(r=>r.json()).then(d=>setConnected(d.connected===true)).catch(()=>setError('Unable to check OpenAI connection'))},[open])
 async function send(){
  if(!connected||busy||!input.trim())return
  const content=input.trim()
  setBusy(true);setError('')
  try{
   let currentId=chatId
   if(!currentId){
    const res=await fetch('/api/ai/conversations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode})})
    const data=await res.json()
    if(!res.ok)throw Error(data.error||'Could not create chat')
    currentId=data.chat.id;setChatId(currentId)
   }
   const next:Message[]=[...messages,{role:'user',content}]
   setMessages(next);setInput('')
   let engineContext:unknown=undefined
   if(useData && context==='Realtor Partner Engine'){
     try{
       const raw=window.localStorage.getItem('lg_realtor_partner_engine_v1')
       const data=raw?JSON.parse(raw):{}
       const prospects=Array.isArray(data.prospects)?data.prospects:[]
       const secondary=Array.isArray(data.secondary)?data.secondary:[]
       const primary=Array.isArray(data.primary)?data.primary:[]
       engineContext={source:'Realtor Partner Engine browser-local snapshot',prospectCount:prospects.length,secondaryCount:secondary.length,primaryCount:primary.length,prospectStages:[0,1,2,3,4].map(stage=>({stage,count:prospects.filter((x:{stage?:number})=>x.stage===stage).length})),secondaryGroups:['Bus','BU','Prog'].map(group=>({group,count:secondary.filter((x:{group?:string})=>x.group===group).length})),primaryTiers:['A','B','C'].map(tier=>({tier,count:primary.filter((x:{tier?:string})=>x.tier===tier).length}))}
     }catch{setError('Realtor data could not be read.')}
   }
   const res=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:currentId,mode,messages:next.slice(-16),engine:useData?(context==='Originator Engine'?'originator':'realtor'):undefined,engineContext})})
   const data=await res.json()
   if(!res.ok)throw Error(data.error||'AI request failed')
   setMessages([...next,{role:'assistant',content:data.reply}])
  }catch(e){setError(e instanceof Error?e.message:'AI unavailable')}finally{setBusy(false)}
 }
 return <>
  <button type="button" aria-label={open?'Close Toolbox AI':'Open Toolbox AI'} aria-expanded={open} onClick={()=>setOpen(v=>!v)}
   className="fixed bottom-5 right-5 z-40 border border-[#a26028] bg-[#292929] px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-[#a26028]">
   {open?'× Close AI':'✦ Toolbox AI'}
  </button>
  {open&&<aside aria-label={'Toolbox AI for '+context} className="fixed bottom-[76px] right-3 z-40 flex h-[min(630px,calc(100dvh-100px))] w-[min(420px,calc(100vw-24px))] flex-col border border-border bg-white shadow-2xl sm:right-5">
   <div className="flex items-center justify-between bg-[#292929] px-5 py-4 text-white"><div><strong className="text-sm">✦ Toolbox AI</strong><p className="text-[11px] text-[#d2ccc7]">{context} · {mode}</p></div><button type="button" aria-label="Close assistant" className="text-xl" onClick={()=>setOpen(false)}>×</button></div>
   {connected===false?<div className="space-y-3 p-5 text-sm"><p>Toolbox AI is optional. Connect your OpenAI API key to use the assistant.</p><Link href="/settings" className="text-[#a26028] underline">Connect in Settings →</Link></div>:
   <><div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
    {messages.length===0&&<div><h3 className="mb-2 text-lg">How can I help?</h3><p className="mb-4 text-xs text-muted-foreground">{context==='Originator Engine'?'Ask about prospecting priorities, goals, and follow-up strategies.':'Ask about Realtor outreach, relationship building, and follow-up ideas.'}</p><p className="text-xs text-muted-foreground">Enable read-only context below if you want personalized insights. AI cannot modify your records.</p></div>}
    {messages.map((m,i)=><div key={i} className={'whitespace-pre-wrap p-3 text-xs '+(m.role==='user'?'ml-7 bg-[#eee9e4]':'mr-4 border-l-2 border-[#a26028] bg-[#f5f5f5]')}>{m.content}</div>)}{busy&&<p className="text-xs text-muted-foreground">Thinking…</p>}<div ref={bottomRef} />
   </div>
   <label className="flex items-center gap-2 border-t border-border px-4 py-2 text-xs"><input type="checkbox" checked={useData} onChange={e=>setUseData(e.target.checked)}/> Use current {context} data (read-only)</label>
   {error&&<p role="alert" className="px-4 text-xs text-red-700">{error}</p>}
   <form onSubmit={e=>{e.preventDefault();void send()}} className="flex gap-2 border-t border-border p-3"><input aria-label="Message Toolbox AI" className="min-w-0 flex-1 border border-border-input p-2 text-xs" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Toolbox AI…"/><button className="bg-[#a26028] px-4 text-xs text-white disabled:opacity-40" disabled={!connected||busy||!input.trim()}>Send</button></form>
   <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px]"><button type="button" onClick={()=>{setChatId(null);setMessages([]);setError('')}} className="text-[#a26028]">+ New chat</button><Link href="/toolbox-ai" className="text-[#a26028] underline">Full AI workspace →</Link></div>
   </>}
  </aside>}
 </>
}
