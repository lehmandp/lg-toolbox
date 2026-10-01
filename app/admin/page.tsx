import { notFound, redirect } from 'next/navigation'
import Header from '@/components/header'
import AdminCatalog from '@/components/admin-catalog'
import { createAdminClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import type { Tool } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/admin')

  // 404 rather than 403: don't confirm the page exists to non-admins.
  if (!viewer.isAdmin) notFound()

  const supabase = createAdminClient()
  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('*')
    .order('created_at', { ascending: false })

  if (toolsError) {
    console.error('[admin] tool catalog load failed:', toolsError.message)
  }

  return (
    <div className="min-h-screen">
      <Header isAdmin />
      <div className="mx-auto max-w-[1200px] px-8 pb-24 pt-16">
        <AdminCatalog tools={(tools ?? []) as Tool[]} />
      </div>
    </div>
  )
}
