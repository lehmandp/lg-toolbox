'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ToolModal from '@/components/tool-modal'
import { CountBadge, EmptyState } from '@/components/ui'
import { isProTool, type Tool } from '@/lib/types'

export default function AdminCatalog({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Tool | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(tool: Tool) {
    if (
      !window.confirm(
        `Delete "${tool.name}"? This also removes it from every user's library.`
      )
    ) {
      return
    }
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

  return (
    <>
      {/* Hero action */}
      <div className="grid gap-12 md:grid-cols-2 md:items-start">
        <div>
          <div className="eyebrow mb-6">MASTER ADMIN</div>
          <h1>
            Manage the catalog.
            <br />
            <span className="text-primary">Built by you.</span>
          </h1>
        </div>

        <div className="flex flex-col items-start gap-8">
          <p className="max-w-sm text-muted-foreground">
            Create and publish tools for your marketplace.
          </p>
          <button onClick={() => setCreating(true)} className="btn-primary">
            <span className="text-xl leading-none">+</span>
            Add a tool
          </button>
        </div>
      </div>

      <div className="hairline my-14" />

      {/* Section heading */}
      <div className="mb-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <h2>Catalog management</h2>
          <CountBadge value={tools.length} />
        </div>
        <span className="text-sm text-muted-foreground">
          Unpublished tools are visible only to you.
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-12 border-b border-border">
        <span className="tab" data-active="true">
          All tools
          <span className="tab-count">{tools.length}</span>
        </span>
      </div>

      {error && (
        <p className="mb-6 border border-primary px-4 py-3 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      {tools.length === 0 ? (
        <div className="flex flex-col items-center px-8 py-24 text-center">
          <EmptyStateShim onCreate={() => setCreating(true)} />
        </div>
      ) : (
        <div className="space-y-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex items-center justify-between gap-6 border border-border bg-white p-6"
            >
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-3">
                  <span className="truncate font-medium">{tool.name}</span>
                  {isProTool(tool) ? (
                    <span className="border border-primary px-2 py-px text-[10px] uppercase tracking-[1.8px] text-primary">
                      Pro
                    </span>
                  ) : (
                    <span className="border border-border px-2 py-px text-[10px] uppercase tracking-[1.8px] text-muted-foreground">
                      Free
                    </span>
                  )}
                  {!tool.published && (
                    <span className="border border-border px-2 py-px text-[10px] uppercase tracking-[1.8px] text-muted-foreground">
                      Draft
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {tool.category ?? 'Uncategorised'} · $
                  {Number(tool.monthly_price).toFixed(0)}/mo
                </p>
              </div>

              <div className="flex shrink-0 gap-4">
                <button
                  onClick={() => setEditing(tool)}
                  className="text-sm transition-colors hover:text-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(tool)}
                  disabled={busyId === tool.id}
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  {busyId === tool.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ToolModal onClose={() => setCreating(false)} />}
      {editing && <ToolModal tool={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

/** Empty state whose action opens the modal rather than navigating. */
function EmptyStateShim({ onCreate }: { onCreate: () => void }) {
  return (
    <>
      <span className="mb-6 text-primary">
        <CubeMark />
      </span>
      <h3 className="mb-2">Start your catalog.</h3>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        Add your first tool and publish it to the marketplace.
      </p>
      <button onClick={onCreate} className="link-rule">
        Create your first tool
        <span aria-hidden>↗</span>
      </button>
    </>
  )
}

function CubeMark() {
  return (
    <svg
      width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
