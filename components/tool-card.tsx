'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isPaidTool, type ToolWithState } from '@/lib/types'

interface Props {
  tool: ToolWithState
  variant: 'marketplace' | 'library'
  signedIn: boolean
}

export default function ToolCard({ tool, variant, signedIn }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paid = isPaidTool(tool)
  const native = tool.tool_type === 'native'

  async function mutateLibrary(method: 'POST' | 'DELETE') {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/library', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong.')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  async function launch() {
    setBusy(true)
    setError(null)
    try {
      if (!tool.tool_url) throw new Error('This tool has no launch address yet.')

      if (native && tool.tool_url.startsWith('/')) {
        router.push(tool.tool_url)
      } else {
        window.open(tool.tool_url, '_blank', 'noopener,noreferrer')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not launch this tool.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="flex min-h-[310px] flex-col border border-border bg-white">
      <div className="min-h-[205px] border-b border-border p-5">
        <div className="mb-[18px] flex flex-wrap gap-2">
          <span className={
            'border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[.08em] ' +
            (paid ? 'border-primary bg-primary text-white' : 'border-primary text-primary')
          }>
            {paid ? 'Paid' : 'Free'}
          </span>
          <span className={
            'border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[.08em] ' +
            (native ? 'border-primary text-primary' : 'border-border text-muted-foreground')
          }>
            {native ? 'Native Tool' : 'External Tool'}
          </span>
          {tool.category && (
            <span className="border border-border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[.08em] text-muted-foreground">
              {tool.category}
            </span>
          )}
        </div>

        <h3 className="mb-2 text-[21px]">{tool.name}</h3>
        <p className="text-[13px] leading-[1.45] text-muted-foreground">
          {tool.description ?? 'No description yet.'}
        </p>

        <div className="mt-4 text-xs font-semibold">
          {paid ? 'Paid Product' : 'Free Tool'}
          {!native && (
            <span className="font-normal text-muted-foreground">
              {' '}— launches on its own site
            </span>
          )}
        </div>
        {paid && (
          <p className="mt-2 text-[11px] leading-[1.45] text-muted-foreground">
            Pricing, checkout, and subscription are managed by the product itself.
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 px-5 py-[14px]">
        <span className="text-[10px] uppercase tracking-[.08em] text-muted-foreground">
          {native ? 'LG Toolbox' : 'External'}
        </span>

        {error ? (
          <span className="text-[10px] text-primary">{error}</span>
        ) : !signedIn ? (
          <Link href="/signup" className="border-b border-primary pb-px text-xs font-semibold text-primary">Sign up →</Link>
        ) : variant === 'library' ? (
          <button onClick={launch} disabled={busy} className="border-b border-primary pb-px text-xs font-semibold text-primary">
            {busy ? 'Opening…' : native ? 'Open Tool →' : 'Launch Tool →'}
          </button>
        ) : tool.inLibrary ? (
          <span className="border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground">Added</span>
        ) : (
          <button
            onClick={()=>mutateLibrary('POST')}
            disabled={busy}
            className="border border-primary px-3 py-2 text-[11px] font-semibold text-primary"
          >
            {busy ? 'Adding…' : '+ Add Tool'}
          </button>
        )}
      </div>
    </article>
  )
}
