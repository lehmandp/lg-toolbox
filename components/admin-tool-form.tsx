'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool } from '@/lib/types'

interface Props {
  /** Present when editing; absent when creating. */
  tool?: Tool
  onDone?: () => void
}

export default function AdminToolForm({ tool, onDone }: Props) {
  const router = useRouter()
  const editing = Boolean(tool)

  const [name, setName] = useState(tool?.name ?? '')
  const [description, setDescription] = useState(tool?.description ?? '')
  const [category, setCategory] = useState(tool?.category ?? '')
  const [monthlyPrice, setMonthlyPrice] = useState(String(tool?.monthly_price ?? '0'))
  const [toolUrl, setToolUrl] = useState(tool?.tool_url ?? '')
  const [repositoryUrl, setRepositoryUrl] = useState(tool?.repository_url ?? '')
  const [published, setPublished] = useState(tool?.published ?? false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const price = Number(monthlyPrice)
    if (Number.isNaN(price) || price < 0) {
      setError('Monthly price must be 0 or a positive number.')
      return
    }

    setBusy(true)
    try {
      const res = await fetch(editing ? `/api/tools/${tool!.id}` : '/api/tools', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          category: category || null,
          monthly_price: price,
          tool_url: toolUrl || null,
          repository_url: repositoryUrl || null,
          published,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not save this tool.')

      if (!editing) {
        setName('')
        setDescription('')
        setCategory('')
        setMonthlyPrice('0')
        setToolUrl('')
        setRepositoryUrl('')
        setPublished(false)
      }
      onDone?.()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this tool.')
    } finally {
      setBusy(false)
    }
  }

  const isPro = Number(monthlyPrice) > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border border-border bg-white p-8">
      <div>
        <label htmlFor="name" className="label-field">Tool name</label>
        <input
          id="name" type="text" required value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field" placeholder="Strike Price"
        />
      </div>

      <div>
        <label htmlFor="description" className="label-field">Description</label>
        <textarea
          id="description" rows={3} value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input-field" style={{ height: 'auto', paddingTop: 13 }}
          placeholder="What this tool does, in a sentence or two."
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="label-field">Category</label>
          <input
            id="category" type="text" value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field" placeholder="Pricing"
          />
        </div>

        <div>
          <label htmlFor="monthlyPrice" className="label-field">Monthly price (USD)</label>
          <input
            id="monthlyPrice" type="number" min="0" step="0.01" value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            className="input-field" placeholder="0"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {isPro
              ? 'Above 0 — this is a Pro tool, unlocked by the Pro plan.'
              : '0 — this is a free tool, available to every account.'}
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="toolUrl" className="label-field">Tool URL</label>
        <input
          id="toolUrl" type="url" value={toolUrl}
          onChange={(e) => setToolUrl(e.target.value)}
          className="input-field"
          placeholder={isPro ? 'https://strikeprice.com/sso' : 'https://example.com/tool'}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {isPro
            ? 'For Pro tools this is the SSO entry point. The hub appends ?token=<jwt>.'
            : 'Opened directly in a new tab.'}
        </p>
      </div>

      <div>
        <label htmlFor="repositoryUrl" className="label-field">Repository URL (optional)</label>
        <input
          id="repositoryUrl" type="url" value={repositoryUrl}
          onChange={(e) => setRepositoryUrl(e.target.value)}
          className="input-field" placeholder="https://github.com/lehmandp/strike-price"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 pt-2">
        <input
          type="checkbox" checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="h-4 w-4 accent-primary"
        />
        <span className="text-sm text-foreground">Publish in marketplace</span>
      </label>

      {error && (
        <p className="border border-primary px-4 py-3 text-sm text-primary" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Saving…' : editing ? 'Save changes' : 'Create tool'}
      </button>
    </form>
  )
}
