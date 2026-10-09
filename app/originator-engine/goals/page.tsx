import { redirect } from 'next/navigation'
import Header from '@/components/header'
import OriginatorEngineGoals from '@/components/originator-engine/goals'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OriginatorEngineGoalsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/originator-engine/goals')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <OriginatorEngineGoals />
    </div>
  )
}
