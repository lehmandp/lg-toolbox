export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete'
export type ToolType = 'native' | 'external'

export interface Tool {
  id: string
  name: string
  description: string | null
  category: string | null
  monthly_price: number
  tool_url: string | null
  repository_url: string | null
  published: boolean
  tool_type: ToolType
  display_order: number
  featured: boolean
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

export interface ToolWithState extends Tool {
  inLibrary: boolean
  locked: boolean
}

/**
 * Catalog access label only.
 * monthly_price is retained for backward compatibility with the existing
 * schema: 0 = Free, any positive value = Paid. LG Toolbox itself does not
 * collect or enforce payment for paid catalog items.
 */
export function isPaidTool(tool: Pick<Tool, 'monthly_price'>): boolean {
  return Number(tool.monthly_price) > 0
}

/** @deprecated Use isPaidTool. Kept so dormant legacy subscription code still builds. */
export const isProTool = isPaidTool

export function toolSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
