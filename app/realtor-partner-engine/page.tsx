import { redirect } from 'next/navigation'
import Header from '@/components/header'
import RealtorPartnerEngine from '@/components/realtor-partner-engine/client'
import { getViewer } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function RealtorPartnerEnginePage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/realtor-partner-engine')

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <Header isAdmin={viewer.isAdmin} />
      <RealtorPartnerEngine />
    </div>
  )
}
