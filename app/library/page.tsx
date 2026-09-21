import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/header'
import ToolCard from '@/components/tool-card'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import { isProTool, type Tool, type ToolWithState } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/library')

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('user_tools')
    .select('added_at, tools(*)')
    .eq('user_id', viewer.user.id)
    .order('added_at', { ascending: false })

  const items: ToolWithState[] = (rows ?? [])
    .map((row) => row.tools as unknown as Tool | null)
    .filter((t): t is Tool => Boolean(t))
    .map((tool) => ({
      ...tool,
      inLibrary: true,
      // A Pro tool stays in the library if the plan lapses, but locks.
      locked: isProTool(tool) && !viewer.isPro,
    }))

  const hasLapsed = items.some((t) => t.locked)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="hairline" />

      <div className="mx-auto max-w-[1200px] px-8 py-20">
        <div className="mb-6 flex items-baseline justify-between">
          <div className="eyebrow">MY LIBRARY</div>
          <span className="text-sm text-muted-foreground">
            {viewer.isPro ? 'Pro plan active' : 'Free plan'}
          </span>
        </div>

        <h1 className="mb-4">
          {viewer.user.user_metadata?.full_name
            ? `Welcome back, ${String(viewer.user.user_metadata.full_name).split(' ')[0]}`
            : 'Your tools'}
        </h1>

        <p className="mb-16 max-w-xl text-sm text-muted-foreground">
          Everything you have added. Launch a tool to open it in a new tab.
        </p>

        {hasLapsed && (
          <div className="mb-12 border border-primary bg-white px-6 py-5">
            <p className="text-sm text-foreground">
              Some tools in your library need an active Pro subscription.{' '}
              <Link href="/upgrade" className="border-b border-primary pb-px text-primary">
                Reactivate Pro
              </Link>
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="border border-border bg-white p-16 text-center">
            <div className="eyebrow mb-6">EMPTY LIBRARY</div>
            <h2 className="mb-4">No tools yet</h2>
            <p className="mx-auto mb-10 max-w-md text-sm text-muted-foreground">
              Browse the marketplace and add the tools you want to use. Free tools are
              available instantly.
            </p>
            <Link href="/marketplace" className="btn-primary">
              <span className="text-xl">+</span>
              Browse marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {items.map((tool) => (
              <ToolCard key={tool.id} tool={tool} variant="library" signedIn />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
