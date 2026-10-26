import { redirect } from 'next/navigation'
import Header from '@/components/header'
import { getViewer } from '@/lib/auth'
import ProfileSettings from '@/components/profile-settings'
export const dynamic='force-dynamic'
export default async function SettingsPage(){
 const viewer=await getViewer()
 if(!viewer)redirect('/login?next=/settings')
 return <div className="min-h-screen"><Header isAdmin={viewer.isAdmin}/><main className="mx-auto max-w-[1000px] px-6 py-12"><div className="eyebrow mb-2">MY ACCOUNT</div><h1>Settings</h1><p className="mt-3 mb-9 text-sm text-muted-foreground">Manage the professional information used across your native Toolbox applications.</p><ProfileSettings/></main></div>
}
