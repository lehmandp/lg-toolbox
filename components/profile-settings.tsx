'use client'
import { useEffect, useState } from 'react'
import AIConnectionSettings from '@/components/ai-connection-settings'
type Profile={full_name:string;company:string;nmls:string;company_nmls:string;phone:string;email:string;website:string;business_address:string;license_state:string;license_number:string;tagline:string;review_url:string;disclosure:string;logo_url:string;headshot_url:string;branding_default:'logo'|'headshot'|'both'|'none'}
const empty:Profile={full_name:'',company:'',nmls:'',company_nmls:'',phone:'',email:'',website:'',business_address:'',license_state:'',license_number:'',tagline:'',review_url:'',disclosure:'',logo_url:'',headshot_url:'',branding_default:'logo'}
export default function ProfileSettings(){
 const [profile,setProfile]=useState<Profile>(empty)
 const [busy,setBusy]=useState(false)
 const [message,setMessage]=useState('')
 const [uploading,setUploading]=useState<'logo'|'headshot'|null>(null)
 useEffect(()=>{fetch('/api/profile',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d.profile)setProfile({...empty,...d.profile})}).catch(()=>setMessage('Could not load professional profile.'))},[])
 function field(k:keyof Profile,label:string,placeholder=''){return <label className="block text-xs font-medium">{label}<input className="mt-2 w-full border border-border-input bg-white p-3 text-sm" placeholder={placeholder} value={profile[k]} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))}/></label>}
 async function saveProfile(){
  setBusy(true);setMessage('')
  try{const r=await fetch('/api/profile',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not save');setMessage('Profile saved.')}catch(e){setMessage(e instanceof Error?e.message:'Could not save')}finally{setBusy(false)}
 }
 async function upload(kind:'logo'|'headshot',file:File|undefined){
  if(!file)return
  setMessage('')
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){setMessage('Please select a PNG, JPEG or WebP under 5 MB.');return}
  setUploading(kind)
  try{
   const form=new FormData()
   form.append('kind',kind)
   form.append('file',file)
   const response=await fetch('/api/profile/image',{method:'POST',body:form})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Image upload failed')
   setProfile(p=>({...p,[kind==='logo'?'logo_url':'headshot_url']:data.url}))
   setMessage((kind==='logo'?'Logo':'Headshot')+' uploaded and saved.')
  }catch(error){setMessage(error instanceof Error?error.message:'Upload failed')}
  finally{setUploading(null)}
 }
 return <div className="space-y-7">
  <section className="border border-border bg-white p-6">
   <div className="eyebrow mb-2">PROFESSIONAL PROFILE</div>
   <h2 className="mb-2">Your business identity</h2>
   <p className="mb-6 text-sm text-muted-foreground">Saved once per account, available to your native Toolbox forms, reports and exports.</p>
   <div className="grid gap-5 sm:grid-cols-2">
    {field('full_name','Full name')}
    {field('company','Company')}
    {field('nmls','Individual NMLS')}
    {field('company_nmls','Company NMLS')}
    {field('phone','Business phone')}
    {field('email','Business email')}
    {field('website','Website')}
    {field('business_address','Business address')}
    {field('license_state','License state')}
    {field('license_number','State license number')}
    {field('tagline','Tagline')}
    <div className="sm:col-span-2">{field('review_url','Review URL','https://example.com/reviews')}<p className="mt-2 text-xs text-muted-foreground">Paste a Google, Yelp, or other review page URL. Email and document templates can use this link for review requests.</p>{profile.review_url&&/^https?:\/\//i.test(profile.review_url)&&<a href={profile.review_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium underline">Test review link ↗</a>}</div>
   </div>
   <label className="mt-5 block text-xs font-medium">Default disclosures
    <textarea rows={3} maxLength={2000} value={profile.disclosure} onChange={e=>setProfile(p=>({...p,disclosure:e.target.value}))} className="mt-2 w-full border border-border-input bg-white p-3 text-sm" placeholder="Business licensing and required disclosure language" />
   </label>
   <div className="mt-6 grid gap-4 sm:grid-cols-2">
    {(['logo','headshot'] as const).map(kind=><div key={kind} className="border border-border-input p-4">
     <div className="mb-2 text-sm font-semibold">{kind==='logo'?'Company logo':'Professional headshot'}</div>
     {profile[kind==='logo'?'logo_url':'headshot_url']?<img src={profile[kind==='logo'?'logo_url':'headshot_url']} alt={kind==='logo'?'Uploaded logo':'Uploaded headshot'} className="mb-3 h-28 max-w-full object-contain" />:<p className="mb-3 text-xs text-muted-foreground">No image uploaded</p>}
     <label className="inline-block cursor-pointer border border-border-input px-3 py-2 text-xs font-semibold">
      {uploading===kind?'Uploading…':'Choose image'}
      <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={uploading!==null} onChange={e=>{void upload(kind,e.target.files?.[0]);e.target.value=''}} />
     </label>
     <p className="mt-2 text-xs text-muted-foreground">PNG, JPEG or WebP, up to 5 MB. Images may appear on public reports.</p>
    </div>)}
   </div>
   <label className="mt-6 block text-xs font-medium">Default branding for new reports and forms
    <select value={profile.branding_default} onChange={e=>setProfile(p=>({...p,branding_default:e.target.value as Profile['branding_default']}))} className="mt-2 block w-full max-w-sm border border-border-input bg-white p-3 text-sm">
     <option value="logo">Company logo</option>
     <option value="headshot">Headshot</option>
     <option value="both">Logo + headshot</option>
     <option value="none">No images</option>
    </select>
   </label>
   <p className="mt-3 text-xs text-muted-foreground">Individual tools can override the default. Images and disclosures are not inserted into existing exports automatically until those tools adopt the shared profile.</p>
   <button className="btn-primary mt-6" onClick={saveProfile} disabled={busy}>Save professional settings</button>
  </section>
  <AIConnectionSettings/>
  <section className="border border-border bg-white p-6"><div className="eyebrow mb-2">NATIVE APP ACCESS</div><h2 className="mb-3">Connections & permissions</h2><p className="mb-5 text-xs text-muted-foreground">Originator Engine, Realtor Relationships, and Loan Pilot will each have separate read/write approval controls. These connections are not active in this beta foundation.</p>{['Originator Engine','Realtor Relationships','Loan Pilot'].map(t=><div key={t} className="flex justify-between border-t border-border py-4"><span className="text-sm">{t}</span><span className="text-xs text-muted-foreground">Coming next</span></div>)}</section>
  {message&&<p role="status" className="text-sm text-primary">{message}</p>}
 </div>
}
