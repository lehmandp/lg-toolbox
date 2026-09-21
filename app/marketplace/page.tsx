import Link from 'next/link'
import Header from '@/components/header'
import ToolCard from '@/components/tool-card'
import { createClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import { isProTool, type Tool, type ToolWithState } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const viewer = await getViewer()

  const { data: tools } = await supabase
    .from('tools')
    .select('*')
    .eq('published', true)
    .order('monthly_price', { ascending: true })
    .order('name', { ascending: true })

  let libraryIds = new Set<string>()
  if (viewer) {
    const { data: owned } = await supabase
      .from('user_tools')
      .select('tool_id')
      .eq('user_id', viewer.user.id)
    libraryIds = new Set((owned ?? []).map((r) => r.tool_id))
  }

  const items: ToolWithState[] = ((tools ?? []) as Tool[]).map((tool) => ({
    ...tool,
    inLibrary: libraryIds.has(tool.id),
    locked: isProTool(tool) && !viewer?.isPro,
  }))

  const free = items.filter((t) => !isProTool(t))
  const pro = items.filter((t) => isProTool(t))

  return (
    <div className="min-h-screen">
      <Header />
      <div className="hairline" />

      <div className="mx-auto max-w-[1200px] px-8 py-20">
        <div className="eyebrow mb-6">MARKETPLACE</div>
        <h1 className="mb-4">Every tool, one place</h1>
        <p className="mb-16 max-w-xl text-sm text-muted-foreground">
          Free tools are available to every account. Pro tools are unlocked by a single
          $100/month subscription — no per-tool billing.
        </p>

        {items.length === 0 ? (
          <div className="border border-border bg-white p-16 text-center">
            <h2 className="mb-3">Nothing published yet</h2>
            <p className="text-sm text-muted-foreground">
              Tools will appear here once an admin publishes them.
            </p>
          </div>
        ) : (
          <div className="space-y-16">
            {free.length > 0 && (
              <section>
                <div className="eyebrow mb-6">FREE TOOLS</div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {free.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="marketplace"
                      signedIn={Boolean(viewer)}
                    />
                  ))}
                </div>
              </section>
            )}

            {pro.length > 0 && (
              <section>
                <div className="mb-6 flex items-baseline justify-between">
                  <div className="eyebrow">PRO TOOLS</div>
                  {viewer && !viewer.isPro && (
                    <Link
                      href="/upgrade"
                      className="border-b border-primary pb-px text-sm text-primary"
                    >
                      Unlock all for $100/month ↗
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {pro.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      variant="marketplace"
                      signedIn={Boolean(viewer)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
