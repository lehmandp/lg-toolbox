import { redirect } from 'next/navigation'
import Header from '@/components/header'
import OriginatorEngineProgress from '@/components/originator-engine/progress'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OriginatorEngineProgressPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/originator-engine/progress')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <OriginatorEngineProgress />
    </div>
  )
}
