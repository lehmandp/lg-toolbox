'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isProTool, type ToolWithState } from '@/lib/types'

interface Props {
  tool: ToolWithState
  /** Library hides "Add" and offers "Remove"; marketplace does the reverse. */
  variant: 'marketplace' | 'library'
  signedIn: boolean
}

export default function ToolCard({ tool, variant, signedIn }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pro = isProTool(tool)
  const price = Number(tool.monthly_price)

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
      // Pro tools hand off through a short-lived signed token; free tools
      // just open their URL.
      if (!pro) {
        if (!tool.tool_url) throw new Error('This tool has no launch URL yet.')
        window.open(tool.tool_url, '_blank', 'noopener,noreferrer')
        return
      }

      const res = await fetch('/api/sso/generate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not launch this tool.')
      window.open(body.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not launch this tool.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col border border-border bg-white p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="eyebrow">{tool.category ?? 'TOOL'}</div>
        {pro && (
          <span className="border border-primary px-2 py-1 text-[10px] font-medium uppercase tracking-[1.8px] text-primary">
            Pro
          </span>
        )}
      </div>

      <h3 className="mb-3">{tool.name}</h3>

      <p className="mb-8 flex-1 text-sm text-muted-foreground">
        {tool.description ?? 'No description yet.'}
      </p>

      <div className="mb-6 text-sm text-foreground">
        {pro ? (
          <>
            <span className="font-medium">${price.toFixed(0)}</span>
            <span className="text-muted-foreground"> / month · included with Pro</span>
          </>
        ) : (
          <span className="font-medium">Free</span>
        )}
      </div>

      {error && (
        <p className="mb-4 border border-primary px-3 py-2 text-xs text-primary" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {!signedIn ? (
          <Link href="/signup" className="btn-primary w-full">
            Sign up to add
          </Link>
        ) : tool.locked ? (
          <Link href="/upgrade" className="btn-primary w-full">
            Upgrade to Pro
          </Link>
        ) : variant === 'library' ? (
          <>
            <button onClick={launch} disabled={busy} className="btn-primary flex-1">
              {busy ? 'Working…' : 'Launch'}
            </button>
            <button
              onClick={() => mutateLibrary('DELETE')}
              disabled={busy}
              className="btn-secondary"
              aria-label={`Remove ${tool.name} from library`}
            >
              Remove
            </button>
          </>
        ) : tool.inLibrary ? (
          <Link href="/library" className="btn-secondary w-full">
            In your library
          </Link>
        ) : (
          <button
            onClick={() => mutateLibrary('POST')}
            disabled={busy}
            className="btn-primary w-full"
          >
            {busy ? 'Adding…' : 'Add to library'}
          </button>
        )}
      </div>
    </div>
  )
}
