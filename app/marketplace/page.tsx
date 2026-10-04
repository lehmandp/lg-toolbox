import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/header'
import MarketplaceGrid from '@/components/marketplace-grid'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import type { Tool, ToolWithState } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/marketplace')

  const catalog = createAdminClient()
  const { data: tools, error: toolsError } = await catalog
    .from('tools')
    .select('*')
    .eq('published', true)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (toolsError) {
    console.error('[marketplace] catalog load failed:', toolsError.message)
  }

  let libraryIds = new Set<string>()
  const { data: owned } = await supabase
    .from('user_tools')
    .select('tool_id')
    .eq('user_id', viewer.user.id)
  libraryIds = new Set((owned ?? []).map((r) => r.tool_id))

  const items: ToolWithState[] = ((tools ?? []) as Tool[]).map((tool) => ({
    ...tool,
    inLibrary: libraryIds.has(tool.id),
    locked: false,
  }))

  return (
    <div className="min-h-screen">
      <Header isAdmin={viewer.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-8 pb-24">
        <section className="grid gap-12 py-14 md:grid-cols-[1fr_420px] md:items-end">
          <div>
            <div className="eyebrow mb-3">MARKETPLACE</div>
            <h1>Find the tools<br />you actually use.</h1>
            <p className="mt-4 max-w-2xl text-[15px] text-muted-foreground">
              Build your own toolbox with free native tools, free tools hosted elsewhere,
              and independent paid software products.
            </p>
          </div>

          <div className="border-l border-border pl-7">
            <strong className="mb-1 block text-sm">LG Loan Toolbox is free.</strong>
            <p className="mb-3 text-xs text-muted-foreground">
              Your account is free. Paid products, when offered, manage their own pricing and subscriptions separately.
            </p>
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

        <MarketplaceGrid tools={items} signedIn />
      </main>
    </div>
  )
}
