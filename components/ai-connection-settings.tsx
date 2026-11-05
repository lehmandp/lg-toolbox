'use client'
import {useEffect,useState} from 'react'
import Link from 'next/link'

export default function AIConnectionSettings(){
 const [status,setStatus]=useState<'checking'|'connected'|'disconnected'|'reconnect'|'error'>('checking')
 const [key,setKey]=useState('')
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 async function refresh(){
  try{
   const response=await fetch('/api/ai/settings',{cache:'no-store'})
   const data=await response.json()
   if(!response.ok)throw new Error(data.error||'Could not check connection')
   setStatus(data.connected?'connected':data.needsReconnect?'reconnect':'disconnected')
  }catch(error){setStatus('error');setNotice(error instanceof Error?error.message:'Connection status unavailable')}
 }
 useEffect(()=>{void refresh()},[])
 async function save(){
  if(key.length<20)return
  setBusy(true);setNotice('')
  try{
   const response=await fetch('/api/ai/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key})})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Could not save key')
   setKey('')
   setStatus('connected')
   setNotice('OpenAI connection saved.')
  }catch(error){setNotice(error instanceof Error?error.message:'Could not save key')}
  finally{setBusy(false)}
 }
 async function disconnect(){
  if(!window.confirm('Disconnect your OpenAI API key? Toolbox AI will stop working until you reconnect.'))return
  setBusy(true);setNotice('')
  try{
   const response=await fetch('/api/ai/settings',{method:'DELETE'})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Could not disconnect')
   setStatus('disconnected')
   setKey('')
   setNotice('OpenAI disconnected.')
  }catch(error){setNotice(error instanceof Error?error.message:'Could not disconnect')}
  finally{setBusy(false)}
 }
 return <section className="border border-border bg-white p-6">
  <div className="eyebrow mb-2">TOOLBOX AI</div>
  <h2 className="mb-2">OpenAI connection</h2>
  <p className="mb-4 text-sm text-muted-foreground">Manage the API key used by Toolbox AI. Your existing encrypted key remains in Supabase unless you choose to replace or disconnect it. Keys are never displayed here.</p>
  <div role="status" className="mb-5 border border-border bg-[#f8f7f5] p-4 text-sm">
   <strong>{status==='checking'?'Checking connection…':status==='connected'?'✓ OpenAI connected':status==='reconnect'?'Reconnect required':status==='error'?'Status unavailable':'OpenAI not connected'}</strong>
   {status==='reconnect'&&<p className="mt-1 text-xs">The stored key cannot currently be decrypted. Reconnect only if you intend to replace it.</p>}
   {status==='connected'&&<p className="mt-2 text-xs"><Link href="/toolbox-ai" className="text-primary underline">Open Toolbox AI</Link></p>}
  </div>
  <label htmlFor="profile-openai-key" className="block text-xs font-semibold">{status==='connected'?'Replace OpenAI API key':'OpenAI API key'}</label>
  <input id="profile-openai-key" type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="sk-…" className="mt-2 w-full border border-border-input p-3 text-sm"/>
  <p className="mt-2 text-xs text-muted-foreground">API billing is separate from ChatGPT. Manage keys at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI API Keys</a>.</p>
  <div className="mt-5 flex flex-wrap items-center gap-3">
   <button className="btn-primary" onClick={()=>void save()} disabled={busy||status==='checking'||key.length<20}>{status==='connected'?'Replace key':'Connect OpenAI'}</button>
   {status==='connected'&&<button type="button" onClick={()=>void disconnect()} disabled={busy} className="border border-border px-4 py-2 text-sm hover:border-primary">Disconnect</button>}
   {status==='error'&&<button type="button" onClick={()=>void refresh()} disabled={busy} className="text-sm underline">Retry</button>}
  </div>
  {notice&&<p className="mt-4 text-sm" role="status">{notice}</p>}
 </section>
}
