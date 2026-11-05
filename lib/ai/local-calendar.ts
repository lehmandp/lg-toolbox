export function localCalendar(timeZone: string, now = new Date()) {
  const safeZone = (() => { try { new Intl.DateTimeFormat('en-US',{timeZone}); return timeZone } catch { return 'UTC' } })()
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:safeZone,year:'numeric',month:'2-digit',day:'2-digit',weekday:'long'}).formatToParts(now)
  const part=(kind:string)=>parts.find(x=>x.type===kind)?.value||''
  const date=[part('year'),part('month'),part('day')].join('-')
  const weekday=part('weekday')
  const current=new Date(date+'T12:00:00Z')
  const monday=new Date(current); monday.setUTCDate(current.getUTCDate()-(current.getUTCDay()+6)%7)
  const tomorrow=new Date(current); tomorrow.setUTCDate(current.getUTCDate()+1)
  return {timeZone:safeZone,date,weekday,tomorrow:tomorrow.toISOString().slice(0,10),tomorrowWeekday:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][tomorrow.getUTCDay()],weekStarting:monday.toISOString().slice(0,10)}
}
