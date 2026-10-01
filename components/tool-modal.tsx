'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tool, ToolType } from '@/lib/types'

const CATEGORIES = [
  'Calculator',
  'Business Planning',
  'Qualification',
  'Database / CRM',
  'Marketing',
  'Income',
  'Planning',
  'Other',
]

interface Props {
  tool?: Tool
  onClose: () => void
}

export default function ToolModal({ tool, onClose }: Props) {
  const router = useRouter()
  const editing = Boolean(tool)

  const [name, setName] = useState(tool?.name ?? '')
  const [description, setDescription] = useState(tool?.description ?? '')
  const [category, setCategory] = useState(tool?.category ?? 'Calculator')
  const [monthlyPrice, setMonthlyPrice] = useState(String(tool?.monthly_price ?? '0'))
  const [toolType, setToolType] = useState<ToolType>(tool?.tool_type ?? 'native')
  const [displayOrder, setDisplayOrder] = useState(String(tool?.display_order ?? 100))
  const [toolUrl, setToolUrl] = useState(tool?.tool_url ?? '')
  const [repositoryUrl, setRepositoryUrl] = useState(tool?.repository_url ?? '')
  const [published, setPublished] = useState(tool?.published ?? false)
  const [featured, setFeatured] = useState(tool?.featured ?? false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const order = Number(displayOrder)

    if (Number.isNaN(price) || price < 0) {
      setError('Monthly price must be 0 or a positive number.')
      return
    }
    if (Number.isNaN(order)) {
      setError('Display order must be a number.')
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
          tool_type: toolType,
          display_order: order,
          tool_url: toolUrl || null,
          repository_url: repositoryUrl || null,
          published,
          featured,
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
            <div className="eyebrow mb-2">{editing ? 'EDIT TOOL' : 'ADD TOOL'}</div>
            <h2 id="tool-modal-title" className="modal-title">
              {editing ? tool?.name : 'New marketplace item'}
            </h2>
            <p className="modal-subtitle">
              This creates the catalog entry. Build the software separately, then register it here.
            </p>
          </div>
          <button type="button" onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-[18px]">
            <label htmlFor="name" className="field-label">Tool name</label>
            <input
              id="name" required autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
              placeholder="VA Payment Calculator"
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="description" className="field-label">Description</label>
            <textarea
              id="description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field-input"
              placeholder="What does this help a loan originator do?"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-[18px]">
              <label htmlFor="category" className="field-label">Category</label>
              <select id="category" value={category} onChange={(e)=>setCategory(e.target.value)} className="field-input">
                {CATEGORIES.map((c)=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-[18px]">
              <label htmlFor="monthlyPrice" className="field-label">Access</label>
              <select
                id="monthlyPrice"
                value={Number(monthlyPrice) > 0 ? 'premium' : 'free'}
                onChange={(e)=>setMonthlyPrice(e.target.value === 'premium' ? '100' : '0')}
                className="field-input"
              >
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="mb-[18px]">
              <label htmlFor="toolType" className="field-label">Tool type</label>
              <select id="toolType" value={toolType} onChange={(e)=>setToolType(e.target.value as ToolType)} className="field-input">
                <option value="native">Native LG Toolbox Tool</option>
                <option value="external">Standalone / External App</option>
              </select>
            </div>

            <div className="mb-[18px]">
              <label htmlFor="displayOrder" className="field-label">Display order</label>
              <input
                id="displayOrder" type="number" value={displayOrder}
                onChange={(e)=>setDisplayOrder(e.target.value)}
                className="field-input"
              />
            </div>
          </div>

          {Number(monthlyPrice) > 0 && (
            <div className="mb-[18px]">
              <label htmlFor="price" className="field-label">Monthly price ($)</label>
              <input
                id="price" type="number" min="0" step="0.01" value={monthlyPrice}
                onChange={(e)=>setMonthlyPrice(e.target.value)}
                className="field-input"
              />
            </div>
          )}

          <div className="mb-[18px]">
            <label htmlFor="toolUrl" className="field-label">Destination route / URL</label>
            <input
              id="toolUrl" value={toolUrl}
              onChange={(e)=>setToolUrl(e.target.value)}
              className="field-input"
              placeholder={toolType === 'native' ? '/originator-engine' : 'https://crossqual.com'}
            />
          </div>

          <div className="mb-[18px]">
            <label htmlFor="repositoryUrl" className="field-label">Repository URL <span className="font-normal text-muted-foreground">(optional)</span></label>
            <input
              id="repositoryUrl" type="url" value={repositoryUrl}
              onChange={(e)=>setRepositoryUrl(e.target.value)}
              className="field-input"
              placeholder="https://github.com/..."
            />
          </div>

          <div className="mb-3 flex items-center justify-between border border-border px-3 py-3">
            <span className="text-xs font-medium">Published in Marketplace</span>
            <button
              type="button" role="switch" aria-checked={published}
              onClick={()=>setPublished((v)=>!v)}
              className="toggle-track" data-on={published}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="mb-6 flex items-center justify-between border border-border px-3 py-3">
            <span className="text-xs font-medium">Featured Tool</span>
            <button
              type="button" role="switch" aria-checked={featured}
              onClick={()=>setFeatured((v)=>!v)}
              className="toggle-track" data-on={featured}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          {error && (
            <p className="mb-4 border border-primary px-4 py-3 text-sm text-primary" role="alert">{error}</p>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : 'Save Tool'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
