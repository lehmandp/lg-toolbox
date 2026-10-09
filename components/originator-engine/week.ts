import type { ActivityEntry } from './storage'

export const activityKeys = ['face','bread','calls','events','content','cards','gifts','newRealtors','newOffices','newVips','leads','deals'] as const

export type ActivityKey = typeof activityKeys[number]

export function dateKey(d: Date) {
  const y=d.getFullYear()
  const m=String(d.getMonth()+1).padStart(2,'0')
  const day=String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

export function startOfWeek(d: Date) {
  const x=new Date(d)
  const day=x.getDay()
  x.setDate(x.getDate()+(day===0?-6:1-day))
  x.setHours(0,0,0,0)
  return x
}

export function endOfWeek(d: Date) {
  const x=startOfWeek(d)
  x.setDate(x.getDate()+6)
  x.setHours(23,59,59,999)
  return x
}

export function previousWeek(d: Date) {
  const current=startOfWeek(d)
  const prev=new Date(current)
  prev.setDate(prev.getDate()-7)
  return { start:prev, end:endOfWeek(prev) }
}

export function inRange(row: ActivityEntry, a: Date, b: Date) {
  const d=new Date(row.date+'T12:00:00')
  return d>=a && d<=b
}

export function aggregate(rows: ActivityEntry[]) {
  const out = Object.fromEntries(activityKeys.map(k=>[k,0])) as Record<ActivityKey,number>
  rows.forEach(r=>activityKeys.forEach(k=>{out[k]+=Number(r[k]||0)}))
  return out
}

export function money(n:number) {
  if (Math.abs(n)>=1_000_000) return '$'+(n/1_000_000).toFixed(1)+'M'
  if (Math.abs(n)>=1_000) return '$'+Math.round(n/1_000)+'K'
  return '$'+Math.round(n).toLocaleString()
}
