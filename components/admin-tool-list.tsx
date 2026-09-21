'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminToolForm from '@/components/admin-tool-form'
import { isProTool, type Tool } from '@/lib/types'

export default function AdminToolList({ tools }: { tools: Tool[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function remove(tool: Tool) {
    if (!window.confirm(`Delete "${tool.name}"? This also removes it from every user's library.`)) {
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

  if (tools.length === 0) {
    return (
      <p className="border border-border bg-white p-10 text-center text-sm text-muted-foreground">
        No tools yet. Create the first one above.
      </p>
    )
  }

  return (
    <div className="space-y-px">
      {error && (
        <p className="mb-4 border border-primary px-4 py-3 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      {tools.map((tool) => (
        <div key={tool.id} className="border border-border bg-white">
          <div className="flex items-center justify-between gap-6 p-6">
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
                {tool.category ?? 'Uncategorised'} · ${Number(tool.monthly_price).toFixed(0)}/mo
              </p>
            </div>

            <div className="flex shrink-0 gap-3">
              <button
                onClick={() => setEditingId(editingId === tool.id ? null : tool.id)}
                className="text-sm text-foreground transition-colors hover:text-primary"
              >
                {editingId === tool.id ? 'Close' : 'Edit'}
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

          {editingId === tool.id && (
            <div className="border-t border-border p-6">
              <AdminToolForm tool={tool} onDone={() => setEditingId(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
