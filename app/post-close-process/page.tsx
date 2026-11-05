import { redirect } from 'next/navigation'
import Header from '@/components/header'
import { getViewer } from '@/lib/auth'
import PostCloseProcess from '@/components/post-close-process'
export const dynamic = 'force-dynamic'
export default async function Page() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/post-close-process')
  return <><Header isAdmin={viewer.isAdmin} /><PostCloseProcess /></>
}
