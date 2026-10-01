import Link from 'next/link'
import Header from '@/components/header'
import MarketplaceGrid from '@/components/marketplace-grid'
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
    .order('display_order', { ascending: true })
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

  return (
    <div className="min-h-screen">
      <Header isAdmin={viewer?.isAdmin ?? false} />
      <main className="mx-auto max-w-[1200px] px-8 pb-24">
        <section className="grid gap-12 py-14 md:grid-cols-[1fr_420px] md:items-end">
          <div>
            <div className="eyebrow mb-3">MARKETPLACE</div>
            <h1>Find the tools<br />you actually use.</h1>
            <p className="mt-4 max-w-2xl text-[15px] text-muted-foreground">
              Add free calculators and workflow tools to your toolbox. Premium software can
              stay independent while still being available from the same LG Toolbox account.
            </p>
          </div>

          <div className="border-l border-border pl-7">
            <strong className="mb-1 block text-sm">
              Your account: {viewer?.isPro ? 'Pro' : 'Free'}
            </strong>
            <p className="mb-3 text-xs text-muted-foreground">
              Free tools can be added immediately. Premium tools unlock with your account access.
            </p>
            {!viewer ? (
              <Link href="/signup" className="link-rule">Create free account ↗</Link>
            ) : !viewer.isPro ? (
              <Link href="/upgrade" className="link-rule">View premium access ↗</Link>
            ) : null}
          </div>
        </section>

        <div className="hairline mb-8" />

        <div className="mb-5 flex items-end justify-between gap-5">
          <div>
            <div className="eyebrow mb-2">AVAILABLE TOOLS</div>
            <h2>Marketplace</h2>
          </div>
          <span className="text-xs text-muted-foreground">{items.length} tools available</span>
        </div>

        <MarketplaceGrid tools={items} signedIn={Boolean(viewer)} />
      </main>
    </div>
  )
}
