import { redirect } from 'next/navigation'
import Header from '@/components/header'
import OriginatorEngineSettings from '@/components/originator-engine/settings'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function OriginatorEngineSettingsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/originator-engine/settings')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <OriginatorEngineSettings />
    </div>
  )
}
