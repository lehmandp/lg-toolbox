export const SETTINGS_KEY = 'lg_originator_engine_settings_v1'
export const ACTIVITY_KEY = 'lg_originator_engine_activity_v1'

export const DEFAULT_SETTINGS = {
  annualIncome: 450000,
  avgLoan: 650000,
  compType: 'bps',
  compBps: 125,
  compFlat: 0,
  conversion: 22,
  workingWeeks: 52,
  weeklyFace: 15,
  weeklyBread: 5,
  weeklyCalls: 60,
  weeklyEvents: 1,
  weeklyContent: 2,
  weeklyCards: 10,
  monthlyRealtors: 12,
  monthlyOffices: 4,
  monthlyVips: 4,
  monthlyGifts: 10,
  monTheme: 'REALTOR DAY',
  monAm: 'Blast Email\nCall Top 40\n10/10/10 Socials',
  monPm: 'Client Consults\nZoom Meetings',
  tueTheme: 'TUESDAY UPDATES',
  tueAm: 'Pipeline Meeting\nUpdates\nAgent/Office Calls',
  tuePm: 'Cold Calls\nClient Consults\nZoom Meetings',
  wedTheme: 'PRE-APPS DAY',
  wedAm: 'Email Blast\nCalls to Agents / TBDs',
  wedPm: 'TBD / Process Calls\nPost-Close Emails / Calls',
  thuTheme: 'PAST CLIENTS / VIP DAY',
  thuAm: 'Recent Closings\nLOTO\nVIP List Calls',
  thuPm: 'Client Consults\nZoom Meetings',
  friTheme: 'ON-TIME DAY',
  friAm: 'Business Planning\nProjects\nTracker Finalized',
  friPm: 'Content Filming\nGo Home',
  dailyNotes: {} as Record<string,string>,
}

export type EngineSettings = typeof DEFAULT_SETTINGS

export type ActivityEntry = {
  id: string
  type: 'individual' | 'bulk'
  date: string
  createdAt: string
  title: string
  category: string
  note: string
  face: number
  bread: number
  calls: number
  events: number
  content: number
  cards: number
  gifts: number
  newRealtors: number
  newOffices: number
  newVips: number
  leads: number
  deals: number
}

export const emptyActivity = (): ActivityEntry => ({
  id: '',
  type: 'individual',
  date: new Date().toISOString().slice(0, 10),
  createdAt: '',
  title: '',
  category: 'Realtor',
  note: '',
  face: 0,
  bread: 0,
  calls: 0,
  events: 0,
  content: 0,
  cards: 0,
  gifts: 0,
  newRealtors: 0,
  newOffices: 0,
  newVips: 0,
  leads: 0,
  deals: 0,
})

export function readSettings(): EngineSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function writeSettings(settings: EngineSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function readActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const rows = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]')
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

export function writeActivity(rows: ActivityEntry[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(rows))
}
