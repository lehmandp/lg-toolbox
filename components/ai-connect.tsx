'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'

export default function AIConnect(){
 const [apiKey,setApiKey]=useState('')
 const [connected,setConnected]=useState(false)
 const [checking,setChecking]=useState(true)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 useEffect(()=>{fetch('/api/ai/settings',{cache:'no-store'}).then(r=>r.json()).then(x=>{
  setConnected(x.connected===true)
  if(x.needsReconnect)setMessage('Your previous connection used a different encryption key. Please reconnect your OpenAI API key for production.')
 }).catch(()=>setMessage('Could not check connection.')).finally(()=>setChecking(false))},[])
 async function save(){
  setBusy(true);setMessage('')
  try{
   const r=await fetch('/api/ai/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey})})
   const d=await r.json()
   if(!r.ok)throw Error(d.error||'Unable to connect')
   setApiKey('');setConnected(true);setMessage('OpenAI connection saved. Toolbox AI is ready to test.')
  }catch(e){setMessage(e instanceof Error?e.message:'Connection failed')}
  finally{setBusy(false)}
 }
 return <main className="mx-auto max-w-[720px] px-6 py-10">
  <Link className="text-sm text-primary underline" href="/toolbox-ai">← Toolbox AI</Link>
  <h1 className="mt-6 text-3xl font-semibold">Toolbox AI · Beta Connection</h1>
  <p className="mt-4 text-sm text-muted-foreground">Toolbox AI uses your own OpenAI API key. OpenAI API billing is separate from your ChatGPT subscription. Your key is encrypted on the server and never displayed again.</p>
  <div className="mt-6 border border-border bg-white p-6">
   <p role="status" className="text-sm font-semibold">{checking?'Checking…':connected?'OpenAI connected':'OpenAI not connected'}</p>
   <p className="mt-2 text-xs text-muted-foreground">Create or retrieve an API key at <a className="text-primary underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>. Make sure API billing is enabled.</p>
   <label className="mt-5 block text-xs font-semibold" htmlFor="api-key">OpenAI API key</label>
   <input id="api-key" type="password" autoComplete="off" placeholder="sk-…" className="mt-2 w-full border border-border-input p-3 text-sm" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
   <button className="btn-primary mt-4" disabled={checking||busy||apiKey.length<20} onClick={()=>void save()}>{busy?'Connecting…':connected?'Replace API key':'Connect OpenAI'}</button>
   {message&&<p role="status" className="mt-4 text-sm">{message}</p>}
  </div>
  <p className="mt-5 text-xs text-muted-foreground">Beta limitations: read-only module insights. Toolbox AI cannot modify contacts, send messages, or search the internet. Use ChatGPT for live research.</p>
 </main>
}