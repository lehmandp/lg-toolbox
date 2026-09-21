import Link from 'next/link'
import Header from '@/components/header'
import MarketplaceGrid from '@/components/marketplace-grid'
import { RuleLink } from '@/components/ui'
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

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto max-w-[1200px] px-8 pb-24 pt-16">
        {/* Hero */}
        <div className="grid gap-12 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow mb-6">MARKETPLACE</div>
            <h1>
              Every tool.
              <br />
              <span className="text-primary">One place.</span>
            </h1>
          </div>

          <div className="flex flex-col items-start gap-8">
            <p className="max-w-sm text-muted-foreground">
              Free tools are available to every account. Pro tools are unlocked by a
              single $100/month subscription — no per-tool billing.
            </p>
            {!viewer ? (
              <Link href="/signup" className="btn-primary">
                <span className="text-xl leading-none">+</span>
                Get started free
              </Link>
            ) : (
              !viewer.isPro && <RuleLink href="/upgrade">Unlock all for $100/month</RuleLink>
            )}
          </div>
        </div>

        <div className="hairline my-14" />

        <MarketplaceGrid tools={items} signedIn={Boolean(viewer)} />
      </div>
    </div>
  )
}
