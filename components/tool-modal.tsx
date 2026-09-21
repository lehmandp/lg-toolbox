'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool } from '@/lib/types'

const CATEGORIES = [
  'Workflow',
  'Pricing',
  'Calculators',
  'Compliance',
  'Marketing',
  'Analytics',
  'Other',
]

interface Props {
  /** Present when editing; absent when creating. */
  tool?: Tool
  onClose: () => void
}

export default function ToolModal({ tool, onClose }: Props) {
  const router = useRouter()
  const editing = Boolean(tool)

  const [name, setName] = useState(tool?.name ?? '')
  const [description, setDescription] = useState(tool?.description ?? '')
  const [category, setCategory] = useState(tool?.category ?? 'Workflow')
  const [monthlyPrice, setMonthlyPrice] = useState(String(tool?.monthly_price ?? '0'))
  const [toolUrl, setToolUrl] = useState(tool?.tool_url ?? '')
  const [repositoryUrl, setRepositoryUrl] = useState(tool?.repository_url ?? '')
  const [published, setPublished] = useState(tool?.published ?? false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Escape closes, and the page behind must not scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

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

      onClose()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this tool.')
      setBusy(false)
    }
  }

  return (
    <div
      className="modal-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tool-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-panel">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 id="tool-modal-title" className="modal-title">
              {editing ? 'Edit tool' : 'Add a tool'}
            </h2>
            <p className="modal-subtitle">
              Tools stay hidden until you publish them. You can change any of
              this later.
            </p>
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-[18px]">
            <label htmlFor="name" className="field-label">Tool name</label>
            <input
              id="name" type="text" required autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input" placeholder="Name of your tool"
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="description" className="field-label">Description</label>
            <textarea
              id="description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input"
              placeholder="What does this help an originator do?"
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="category" className="field-label">Category</label>
            <select
              id="category" value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field-input"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="monthlyPrice" className="field-label">Monthly price ($)</label>
            <input
              id="monthlyPrice" type="number" min="0" step="0.01" value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              className="field-input" placeholder="0"
            />
            <p className="field-help">Use 0 for free. Set a separate price for each tool.</p>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="toolUrl" className="field-label">Tool address (optional)</label>
            <input
              id="toolUrl" type="url" value={toolUrl}
              onChange={(e) => setToolUrl(e.target.value)}
              className="field-input" placeholder="https://your-tool.com"
            />
            {Number(monthlyPrice) > 0 && (
              <p className="field-help">
                Paid tools open through single sign-on. Point this at the tool&apos;s
                SSO address, e.g. https://strikeprice.com/sso
              </p>
            )}
          </div>

          <div className="mb-[18px]">
            <label htmlFor="repositoryUrl" className="field-label">Repository link (optional)</label>
            <input
              id="repositoryUrl" type="url" value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              className="field-input" placeholder="https://github.com/your-team/your-tool"
            />
            <p className="field-help">A link records the repository; it does not import its code.</p>
          </div>

          <div className="mb-2 mt-6 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() => setPublished((p) => !p)}
              className="toggle-track"
              data-on={published}
            >
              <span className="toggle-knob" />
            </button>
            <span className="text-sm">Publish in marketplace</span>
          </div>
          <p className="field-help mb-6">
            Paid tools display their price. Subscription checkout is not connected yet.
          </p>

          {error && (
            <p className="mb-4 border border-primary px-4 py-3 text-sm text-primary" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Saving…' : 'Save tool'}
          </button>
        </form>
      </div>
    </div>
  )
}
