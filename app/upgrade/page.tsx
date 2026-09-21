'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/header'

const INCLUDED = [
  'Every Pro tool in the marketplace, now and as they launch',
  'Single sign-on — one login across the whole suite',
  'Unlimited free tools',
  'Cancel any time',
]

function UpgradePanel() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled') === '1'

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? 'Could not start checkout.')
      window.location.href = body.url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout.')
      setBusy(false)
    }
  }

  return (
    <>
      {canceled && (
        <p className="mb-8 border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
          Checkout was canceled. Nothing was charged.
        </p>
      )}

      <div className="border border-border bg-white p-10">
        <div className="mb-8 flex items-baseline gap-2">
          <span className="text-[36px] font-semibold leading-none tracking-[-1.62px]">$100</span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>

        <ul className="mb-10 space-y-4">
          {INCLUDED.map((line) => (
            <li key={line} className="flex gap-4 text-sm text-foreground">
              <span className="text-primary">—</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-6 border border-primary px-4 py-3 text-sm text-primary" role="alert">
            {error}
          </p>
        )}

        <button onClick={startCheckout} disabled={busy} className="btn-primary w-full">
          {busy ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure checkout by Stripe. Your card details never touch our servers.
        </p>
      </div>
    </>
  )
}

export default function UpgradePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="hairline" />

      <div className="mx-auto max-w-[560px] px-8 py-20">
        <div className="eyebrow mb-6">LG TOOLBOX PRO</div>
        <h1 className="mb-4">One subscription, every tool</h1>
        <p className="mb-12 text-sm text-muted-foreground">
          Pro unlocks every premium tool in the marketplace for a single monthly price,
          instead of subscribing to each one separately.
        </p>

        <Suspense fallback={null}>
          <UpgradePanel />
        </Suspense>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          <Link href="/marketplace" className="border-b border-border pb-px">
            Back to marketplace
          </Link>
        </p>
      </div>
    </div>
  )
}
