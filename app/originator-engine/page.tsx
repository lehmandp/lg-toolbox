import { redirect } from 'next/navigation'
import Header from '@/components/header'
import OriginatorEngineDashboard from '@/components/originator-engine/dashboard'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OriginatorEnginePage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/originator-engine')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <OriginatorEngineDashboard />
    </div>
  )
}
