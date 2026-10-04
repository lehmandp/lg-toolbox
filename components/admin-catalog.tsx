'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ToolModal from '@/components/tool-modal'
import { isPaidTool, type Tool } from '@/lib/types'

export default function AdminCatalog({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Tool | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(tool: Tool) {
    if (!window.confirm(`Delete "${tool.name}"? This also removes it from every user's toolbox.`)) return
    setBusyId(tool.id)
    setError(null)
    try {
      const res = await fetch(`/api/tools/${tool.id}`, { method: 'DELETE' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not delete this tool.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this tool.')
    } finally {
      setBusyId(null)
    }
  }

  const sorted = [...tools].sort((a,b)=>(a.display_order ?? 100) - (b.display_order ?? 100))

  return (
    <>
      <section className="pb-9">
        <div className="eyebrow mb-3">ADMIN</div>
        <h1>Manage the toolbox.</h1>
        <p className="mt-4 max-w-2xl text-[15px] text-muted-foreground">
          Publish free tools and profile independent paid products from one catalog. Access (Free/Paid)
          and type (Native/External) are managed separately.
        </p>
      </section>

      <div className="hairline" />

      <section className="grid gap-7 pt-8 lg:grid-cols-[390px_1fr]">
        <div className="border border-border bg-white">
          <div className="border-b border-border px-5 py-5">
            <div className="eyebrow mb-2">ADD TOOL</div>
            <h2>New marketplace item</h2>
            <p className="mt-1 text-xs text-muted-foreground">Create the catalog record for a tool or software product.</p>
          </div>

          <div className="p-5">
            <p className="mb-6 text-sm text-muted-foreground">
              Free and Paid are independent from Native and External, so free tools hosted elsewhere work just as well as native tools.
            </p>
            <button onClick={()=>setCreating(true)} className="btn-primary w-full">+ Add a Tool</button>
          </div>
        </div>

        <div>
          <div className="border border-border bg-white">
            <div className="border-b border-border px-5 py-5">
              <div className="eyebrow mb-2">TOOL CATALOG</div>
              <h2>Marketplace inventory</h2>
              <p className="mt-1 text-xs text-muted-foreground">Edit, publish, hide, or update existing tools.</p>
            </div>

            <div className="grid grid-cols-[1.4fr_.7fr_.8fr_.7fr_70px] gap-3 border-b border-border bg-[#fafafa] px-5 py-3 text-[9px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
              <span>Tool</span><span>Access</span><span>Type</span><span>Status</span><span></span>
            </div>

            {error && <p className="m-5 border border-primary px-4 py-3 text-sm text-primary">{error}</p>}

            {sorted.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="mb-5 text-sm text-muted-foreground">No tools yet.</p>
                <button onClick={()=>setCreating(true)} className="btn-primary">Add your first tool</button>
              </div>
            ) : (
              sorted.map((tool)=>(
                <div key={tool.id} className="grid grid-cols-[1.4fr_.7fr_.8fr_.7fr_70px] items-center gap-3 border-b border-border px-5 py-4 last:border-b-0">
                  <div className="min-w-0">
                    <strong className="block truncate text-[13px]">{tool.name}</strong>
                    <span className="text-[11px] text-muted-foreground">{tool.category ?? 'Uncategorised'}</span>
                  </div>

                  <span className={
                    'justify-self-start border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[.08em] ' +
                    (isPaidTool(tool) ? 'border-primary bg-primary text-white' : 'border-primary text-primary')
                  }>
                    {isPaidTool(tool) ? 'Paid' : 'Free'}
                  </span>

                  <span className={
                    'justify-self-start border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[.08em] ' +
                    (tool.tool_type === 'native' ? 'border-primary text-primary' : 'border-border text-muted-foreground')
                  }>
                    {tool.tool_type === 'native' ? 'Native' : 'External'}
                  </span>

                  <span className={'text-[11px] ' + (tool.published ? 'font-semibold text-primary' : 'text-muted-foreground')}>
                    {tool.published ? 'Published' : 'Hidden'}
                  </span>

                  <div className="flex flex-col items-start gap-2">
                    <button onClick={()=>setEditing(tool)} className="border-b border-primary pb-px text-[11px] font-semibold text-primary">Edit</button>
                    <button onClick={()=>remove(tool)} disabled={busyId===tool.id} className="text-[10px] text-muted-foreground hover:text-primary">
                      {busyId===tool.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 border border-border bg-white px-5 py-4">
            <strong className="mb-1 block text-xs">Catalog model</strong>
            <p className="text-xs text-muted-foreground">
              LG Loan Toolbox is free. Paid products can still be saved to My Toolbox, but pricing and subscriptions live on the product&apos;s own site.
            </p>
          </div>
        </div>
      </section>

      {creating && <ToolModal onClose={()=>setCreating(false)} />}
      {editing && <ToolModal tool={editing} onClose={()=>setEditing(null)} />}
    </>
  )
}
