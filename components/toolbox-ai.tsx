'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Message = { role: 'user' | 'assistant'; content: string }
const modes = ['Auto', 'Originator Coach', 'Realtor Prospecting', 'Marketing', 'Lending Guidelines']

export default function ToolboxAI() {
  const pathname = usePathname()
  const [signedIn, setSignedIn] = useState(false)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('Auto')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [key, setKey] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!open) return
    fetch('/api/ai/settings').then(r => r.json()).then(d => {
      setSignedIn(d.authenticated === true)
      setHasKey(d.connected === true)
    }).catch(() => setNotice('Could not check AI connection.'))
  }, [open])

  async function saveKey() {
    if (!key.startsWith('sk-')) { setNotice('Enter an OpenAI API key.'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/ai/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ apiKey: key }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Unable to save')
      setKey(''); setHasKey(true); setNotice('Key securely saved.')
    } catch(e) { setNotice(e instanceof Error ? e.message : 'Unable to save') }
    finally { setBusy(false) }
  }
  async function send() {
    const message = input.trim()
    if (!message || busy) return
    const next: Message[] = [...messages, {role:'user',content:message}]
    setMessages(next); setInput(''); setBusy(true); setNotice('')
    try {
      const r = await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ messages: next.slice(-16), mode, pathname })})
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Assistant unavailable')
      setMessages([...next,{role:'assistant',content:d.reply}])
    } catch(e) { setNotice(e instanceof Error ? e.message : 'Assistant unavailable') }
    finally { setBusy(false) }
  }
  // The launcher is additive: it does not alter current tool navigation or layouts.
  if (pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/signup')) return null
  return <>
    <button type="button" onClick={() => setOpen(!open)} aria-label={open ? 'Close Toolbox AI' : 'Open Toolbox AI'}
      className="fixed bottom-5 right-5 z-40 border border-primary bg-[#292929] px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-primary">
      {open ? '× Close AI' : '✦ Toolbox AI'}
    </button>
    {open && <aside aria-label="Toolbox AI assistant" className="fixed bottom-[76px] right-3 z-40 flex h-[min(690px,calc(100dvh-100px))] w-[min(420px,calc(100vw-24px))] flex-col border border-border bg-white shadow-2xl sm:right-5">
      <div className="flex items-center justify-between bg-[#292929] px-5 py-4 text-white"><div><div className="text-sm font-semibold">✦ TOOLBOX AI</div><div className="text-[11px] text-[#d2ccc7]">Your business assistant</div></div><button onClick={()=>setOpen(false)} aria-label="Close" className="text-xl">×</button></div>
      {!signedIn ? <div className="p-5 text-sm">Sign in to LG Loan Toolbox to use your AI assistant.</div> :
      !hasKey ? <div className="space-y-4 overflow-y-auto p-5">
        <h3 className="text-lg">Connect OpenAI</h3>
        <p className="text-xs text-muted-foreground">Enter your own OpenAI API key. API billing is separate from ChatGPT. The key is encrypted server-side and never returned to the browser.</p>
        <input aria-label="OpenAI API key" type="password" autoComplete="off" className="w-full border border-border-input p-3 text-xs" placeholder="sk-..." value={key} onChange={e=>setKey(e.target.value)}/>
        <button onClick={saveKey} disabled={busy} className="btn-primary w-full justify-center">Connect account</button>
        {notice && <p role="status" className="text-xs">{notice}</p>}
      </div> :
      <>
        <div className="border-b border-border p-3"><label htmlFor="toolbox-ai-mode" className="mb-1 block text-[10px] uppercase tracking-widest text-primary">Assistant mode</label><select id="toolbox-ai-mode" className="w-full border border-border-input bg-white p-2 text-xs" value={mode} onChange={e=>setMode(e.target.value)}>{modes.map(m=><option key={m}>{m}</option>)}</select></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
          {messages.length===0 && <div className="space-y-3"><h3 className="text-lg">How can I help today?</h3><p className="text-xs text-muted-foreground">Plan your day, review prospecting strategy, create marketing, or get help finding the right Toolbox tool.</p>
          {['Help me plan my day','Which Toolbox tool should I use?','Help me plan Realtor outreach'].map(s=><button key={s} className="block w-full border border-border p-3 text-left text-xs hover:border-primary" onClick={()=>setInput(s)}>{s} ↗</button>)}
          <p className="text-[11px] text-muted-foreground">Engine activity and Realtor record updates are not connected yet. AI will not claim to save them.</p></div>}
          {messages.map((m,i)=><div key={i} className={m.role==='user'?'ml-9 bg-[#eee9e4] p-3 text-xs whitespace-pre-wrap':'mr-5 border-l-2 border-primary bg-[#f5f5f5] p-3 text-xs whitespace-pre-wrap'}>{m.content}</div>)}
          {busy && <p className="text-xs text-muted-foreground">Thinking…</p>}
        </div>
        {notice && <p role="alert" className="px-4 py-1 text-xs text-red-700">{notice}</p>}
        <form className="flex gap-2 border-t border-border p-3" onSubmit={e=>{e.preventDefault();void send()}}><input aria-label="Ask Toolbox AI" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask Toolbox AI…" className="min-w-0 flex-1 border border-border-input p-2 text-xs"/><button type="submit" disabled={busy||!input.trim()} className="bg-primary px-4 py-2 text-xs text-white disabled:opacity-40">Send</button></form>
        <div className="border-t border-border px-4 py-2 text-right"><button onClick={async()=>{if (!confirm('Disconnect your OpenAI API key?')) return;const r=await fetch('/api/ai/settings',{method:'DELETE'});if(r.ok){setHasKey(false);setMessages([])}}} className="text-[10px] text-muted-foreground underline">Disconnect OpenAI</button></div>
      </>}
    </aside>}
  </>
}
