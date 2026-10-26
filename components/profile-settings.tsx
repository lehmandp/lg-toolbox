'use client'
import { useEffect, useState } from 'react'
type Profile={full_name:string;company:string;nmls:string;company_nmls:string;phone:string;website:string}
const empty:Profile={full_name:'',company:'',nmls:'',company_nmls:'',phone:'',website:''}
export default function ProfileSettings(){
 const [profile,setProfile]=useState<Profile>(empty)
 const [apiKey,setApiKey]=useState('')
 const [connected,setConnected]=useState(false)
 const [checking,setChecking]=useState(true)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 useEffect(()=>{fetch('/api/ai/settings').then(r=>r.json()).then(d=>setConnected(d.connected===true)).catch(()=>{}).finally(()=>setChecking(false)) ;fetch('/api/profile').then(r=>r.json()).then(d=>{if(d.profile)setProfile({...empty,...d.profile})}).catch(()=>{})},[])
 function field(k:keyof Profile,label:string,placeholder=''){return <label className="block text-xs font-medium">{label}<input className="mt-2 w-full border border-border-input bg-white p-3 text-sm" placeholder={placeholder} value={profile[k]} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))}/></label>}
 async function saveProfile(){
  setBusy(true);setMessage('')
  try{const r=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save');setMessage('Profile saved.')}catch(e){setMessage(e instanceof Error?e.message:'Could not save')}finally{setBusy(false)}
 }
 async function saveKey(){
  setBusy(true);setMessage('')
  try{const r=await fetch('/api/ai/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey})});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save');setConnected(true);setApiKey('');setMessage('OpenAI key saved securely. You can now open Toolbox AI and test a conversation.')}catch(e){setMessage(e instanceof Error?e.message:'Could not save')}finally{setBusy(false)}
 }
 return <div className="space-y-7">
  <section className="border border-border bg-white p-6"><div className="eyebrow mb-2">PROFESSIONAL PROFILE</div><h2 className="mb-6">Your business identity</h2><div className="grid gap-5 sm:grid-cols-2">{field('full_name','Full name')}{field('company','Company')}{field('nmls','Individual NMLS')}{field('company_nmls','Company NMLS (optional)')}{field('phone','Business phone')}{field('website','Website')}</div><button className="btn-primary mt-6" onClick={saveProfile} disabled={busy}>Save profile</button><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="border border-dashed border-border-input p-4"><strong className="text-sm">Professional photo</strong><p className="mt-1 text-xs text-muted-foreground">Secure photo uploads are being added next. Profile details can be saved now.</p></div><div className="border border-dashed border-border-input p-4"><strong className="text-sm">Company logo</strong><p className="mt-1 text-xs text-muted-foreground">Logo uploads will be available once storage permissions are configured.</p></div></div></section>
  <section className="border border-border bg-white p-6"><div className="eyebrow mb-2">AI CONNECTION</div><h2 className="mb-3">Your OpenAI account</h2><p className="mb-4 text-xs text-muted-foreground">Connect your own OpenAI API key. ChatGPT subscriptions do not include API usage. Your key is stored encrypted on the server.</p>
  <div className="mb-5 border border-border bg-[#f8f7f5] p-5">
   <strong className="text-sm">Get started with OpenAI API</strong>
   <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed">
    <li>Sign in to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">OpenAI API Keys ↗</a> and create a secret key.</li>
    <li>Visit <a href="https://platform.openai.com/settings/organization/billing/overview" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">OpenAI API Billing ↗</a> to add a payment method and prepaid credits if needed.</li>
    <li>Start with <strong>$10 in credits</strong> for testing and typical light-to-moderate use. This is an estimate, not a monthly fee or guarantee; heavier use may cost more.</li>
    <li>Paste your API key below and click <strong>Connect OpenAI</strong>. Keep the key private.</li>
   </ol>
   <p className="mt-3 text-xs text-muted-foreground">OpenAI bills API usage separately from ChatGPT Plus, Pro, and other ChatGPT plans. You can review your usage and adjust spending limits in your OpenAI API account.</p>
  </div><div role="status" aria-live="polite" className={'mb-5 border p-4 text-sm '+(connected?'border-[#9fbb9e] bg-[#f0f7ee] text-[#2b612e]':'border-border bg-[#f5f5f5]')}><strong>{checking?'Checking connection…':connected?'✓ OpenAI API key securely saved':'OpenAI not connected'}</strong><p className="mt-1 text-xs">{connected?'Your key is stored securely. Open Toolbox AI to test a conversation.':'Enter your API key below to connect.'}</p>{connected&&<a href="/toolbox-ai" className="mt-2 inline-block font-semibold underline">Open Toolbox AI →</a>}</div><div className="flex flex-wrap gap-2"><input aria-label="OpenAI API key" type="password" autoComplete="off" placeholder="sk-..." value={apiKey} onChange={e=>setApiKey(e.target.value)} className="min-w-[200px] flex-1 border border-border-input p-3 text-sm"/><button className="btn-primary" disabled={busy||!apiKey} onClick={saveKey}>{connected?'Replace key':'Connect OpenAI'}</button></div></section>
  <section className="border border-border bg-white p-6"><div className="eyebrow mb-2">NATIVE APP ACCESS</div><h2 className="mb-3">Connections & permissions</h2><p className="mb-5 text-xs text-muted-foreground">Originator Engine, Realtor Relationships, and Loan Pilot will each have separate read/write approval controls. These connections are not active in this beta foundation.</p>{['Originator Engine','Realtor Relationships','Loan Pilot'].map(t=><div key={t} className="flex justify-between border-t border-border py-4"><span className="text-sm">{t}</span><span className="text-xs text-muted-foreground">Coming next</span></div>)}</section>
  {message&&<p role="status" className="text-sm text-primary">{message}</p>}
 </div>
}
