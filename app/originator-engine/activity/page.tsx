import { redirect } from 'next/navigation'
import Header from '@/components/header'
import OriginatorEngineActivity from '@/components/originator-engine/activity'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OriginatorEngineActivityPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/originator-engine/activity')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <OriginatorEngineActivity />
    </div>
  )
}
