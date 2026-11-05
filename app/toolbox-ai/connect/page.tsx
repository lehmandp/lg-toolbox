import {redirect} from 'next/navigation'
import Header from '@/components/header'
import {getViewer} from '@/lib/auth'
import AIConnect from '@/components/ai-connect'
export const dynamic='force-dynamic'
export default async function ToolboxAIConnectPage(){
 const viewer=await getViewer()
 if(!viewer)redirect('/login?next=/toolbox-ai/connect')
 return <div className="min-h-screen"><Header isAdmin={viewer.isAdmin}/><AIConnect/></div>
}