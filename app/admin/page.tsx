import { notFound, redirect } from 'next/navigation'
import Header from '@/components/header'
import AdminToolForm from '@/components/admin-tool-form'
import AdminToolList from '@/components/admin-tool-list'
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
      <div className="hairline" />

      <div className="mx-auto max-w-[900px] px-8 py-20">
        <div className="eyebrow mb-6">ADMIN</div>
        <h1 className="mb-4">Manage tools</h1>
        <p className="mb-16 max-w-xl text-sm text-muted-foreground">
          Anything priced above $0 becomes a Pro tool, unlocked by the $100/month plan.
          Tools stay hidden until you publish them.
        </p>

        <section className="mb-20">
          <h2 className="mb-6">Add a tool</h2>
          <AdminToolForm />
        </section>

        <div className="hairline mb-20" />

        <section>
          <h2 className="mb-6">All tools</h2>
          <AdminToolList tools={(tools ?? []) as Tool[]} />
        </section>
      </div>
    </div>
  )
}
