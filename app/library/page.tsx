import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/header'
import ToolCard from '@/components/tool-card'
import { CountBadge, EmptyState } from '@/components/ui'
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

      <div className="mx-auto max-w-[1200px] px-8 pb-24 pt-16">
        {/* Hero */}
        <div className="grid gap-12 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow mb-6">YOUR LIBRARY</div>
            <h1>
              Your tools.
              <br />
              <span className="text-primary">All in one place.</span>
            </h1>
          </div>

          <div className="flex flex-col items-start gap-8 md:items-start">
            <p className="max-w-sm text-muted-foreground">
              Choose tools from the marketplace and keep them here.
            </p>
            <Link href="/marketplace" className="btn-primary">
              <span className="text-xl leading-none">+</span>
              Add a tool
            </Link>
          </div>
        </div>

        <div className="hairline my-14" />

        {/* Section heading */}
        <div className="mb-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <h2>My library</h2>
            <CountBadge value={items.length} />
          </div>
          <span className="text-sm text-muted-foreground">
            {viewer.isPro ? 'Pro plan active.' : 'Your selected tools.'}
          </span>
        </div>

        {/* Tabs */}
        <div className="mb-12 border-b border-border">
          <span className="tab" data-active="true">
            All tools
            <span className="tab-count">{items.length}</span>
          </span>
        </div>

        {hasLapsed && (
          <div className="mb-12 border border-primary bg-white px-6 py-5">
            <p className="text-sm">
              Some tools in your library need an active Pro subscription.{' '}
              <Link href="/upgrade" className="border-b border-primary pb-px text-primary">
                Reactivate Pro
              </Link>
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <EmptyState
            title="Make this toolbox yours."
            body="Browse the marketplace and add the tools you want to use."
            actionHref="/marketplace"
            actionLabel="Browse marketplace"
          />
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
