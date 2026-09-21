import { notFound, redirect } from 'next/navigation'
import Header from '@/components/header'
import AdminCatalog from '@/components/admin-catalog'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import type { Tool } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/admin')

  // 404 rather than 403: don't confirm the page exists to non-admins.
  if (!viewer.isAdmin) notFound()

  const supabase = await createClient()
  const { data: tools } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-[1200px] px-8 pb-24 pt-16">
        <AdminCatalog tools={(tools ?? []) as Tool[]} />
      </div>
    </div>
  )
}
