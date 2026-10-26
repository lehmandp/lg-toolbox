import { redirect } from 'next/navigation'
import Header from '@/components/header'
import { getViewer } from '@/lib/auth'
import AIWorkspace from '@/components/ai-workspace'

export const dynamic = 'force-dynamic'
export default async function ToolboxAIPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/toolbox-ai')
  return <div className="min-h-screen"><Header isAdmin={viewer.isAdmin}/><AIWorkspace/></div>
}
