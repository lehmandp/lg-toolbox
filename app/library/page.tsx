import Link from 'next/link'
import { redirect } from 'next/navigation'
import Header from '@/components/header'
import ToolCard from '@/components/tool-card'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getViewer } from '@/lib/auth'
import { isProTool, type Tool, type ToolWithState } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/login?next=/library')

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('user_tools')
    .select('tool_id, added_at')
    .eq('user_id', viewer.user.id)
    .order('added_at', { ascending: false })

  const ids = (rows ?? []).map((row) => row.tool_id)
  let tools: Tool[] = []

  if (ids.length > 0) {
    const { data } = await createAdminClient()
      .from('tools')
      .select('*')
      .in('id', ids)
    tools = (data ?? []) as Tool[]
  }

  const items: ToolWithState[] = tools
    .sort((a, b) => (a.display_order ?? 100) - (b.display_order ?? 100))
    .map((tool) => ({
      ...tool,
      inLibrary: true,
      locked: isProTool(tool) && !viewer.isPro,
    }))

  return (
    <div className="min-h-screen">
      <Header isAdmin={viewer.isAdmin} />
      <main className="mx-auto max-w-[1200px] px-8 pb-24">
        <section className="grid gap-8 py-14 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="eyebrow mb-3">MY TOOLBOX</div>
            <h1>Your tools.<br />Ready when you are.</h1>
            <p className="mt-4 max-w-2xl text-[15px] text-muted-foreground">
              The tools you use live here. Native LG Toolbox modules open inside the hub,
              while standalone products can launch into their own application.
            </p>
          </div>
          <Link href="/marketplace" className="btn-primary">+ Add Tools</Link>
        </section>

        <div className="hairline" />

        <section className="pt-8">
          <div className="mb-5 flex items-end justify-between gap-5">
            <div>
              <div className="eyebrow mb-2">IN USE</div>
              <h2>My Tools</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'tool' : 'tools'} in your toolbox
            </span>
          </div>

          {items.length === 0 ? (
            <div className="border border-dashed border-border-input px-8 py-20 text-center">
              <h3 className="mb-2">Your toolbox is empty.</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Browse the marketplace and add the tools you want to use.
              </p>
              <Link href="/marketplace" className="btn-primary">Browse Marketplace</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
              {items.map((tool) => (
                <ToolCard key={tool.id} tool={tool} variant="library" signedIn />
              ))}
              <Link
                href="/marketplace"
                className="flex min-h-[310px] flex-col items-center justify-center border border-dashed border-border-input px-7 text-center"
              >
                <span className="mb-4 flex h-11 w-11 items-center justify-center border border-primary text-2xl text-primary">+</span>
                <strong className="mb-2">Add another tool</strong>
                <span className="max-w-[220px] text-xs text-muted-foreground">
                  Browse free tools and available products from the LG Toolbox marketplace.
                </span>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
