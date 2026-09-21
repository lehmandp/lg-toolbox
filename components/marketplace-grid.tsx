'use client'

import { useState } from 'react'
import ToolCard from '@/components/tool-card'
import { CountBadge, EmptyState } from '@/components/ui'
import { isProTool, type ToolWithState } from '@/lib/types'

type TabKey = 'all' | 'free' | 'pro'

export default function MarketplaceGrid({
  tools,
  signedIn,
}: {
  tools: ToolWithState[]
  signedIn: boolean
}) {
  const [tab, setTab] = useState<TabKey>('all')

  const free = tools.filter((t) => !isProTool(t))
  const pro = tools.filter((t) => isProTool(t))

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'all', label: 'All tools', count: tools.length },
    { key: 'free', label: 'Free', count: free.length },
    { key: 'pro', label: 'Pro', count: pro.length },
  ]

  const shown = tab === 'free' ? free : tab === 'pro' ? pro : tools

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <h2>Marketplace</h2>
          <CountBadge value={tools.length} />
        </div>
        <span className="text-sm text-muted-foreground">
          One subscription unlocks every Pro tool.
        </span>
      </div>

      <div className="mb-12 flex gap-8 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="tab"
            data-active={tab === t.key}
          >
            {t.label}
            <span className="tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={tools.length === 0 ? 'Nothing published yet.' : 'Nothing in this tab.'}
          body={
            tools.length === 0
              ? 'Tools will appear here once an admin publishes them.'
              : 'Try another tab to see the rest of the catalog.'
          }
          actionHref="/"
          actionLabel="Back to home"
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((tool) => (
            <ToolCard key={tool.id} tool={tool} variant="marketplace" signedIn={signedIn} />
          ))}
        </div>
      )}
    </>
  )
}
