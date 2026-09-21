export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete'

export interface Tool {
  id: string
  name: string
  description: string | null
  category: string | null
  /** 0 means free. Anything above 0 marks the tool as Pro-only. */
  monthly_price: number
  tool_url: string | null
  repository_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface UserTool {
  user_id: string
  tool_id: string
  added_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: SubscriptionStatus | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

/** A tool as rendered in the UI, with per-user state resolved. */
export interface ToolWithState extends Tool {
  inLibrary: boolean
  /** True when the tool costs money and the viewer has no active Pro plan. */
  locked: boolean
}

/** Single source of truth for "is this a Pro tool?". */
export function isProTool(tool: Pick<Tool, 'monthly_price'>): boolean {
  return Number(tool.monthly_price) > 0
}

/**
 * Stable slug for a tool, used as the `tool` claim in SSO tokens.
 * "Strike Price" -> "strike-price", matching what Strike Price expects.
 */
export function toolSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
