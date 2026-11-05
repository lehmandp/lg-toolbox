import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const source=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8')

test('Realtor tool remains isolated behind its own storage hook',()=>{
 const ui=source('components/realtor-partner-engine/client.tsx')
 assert.match(ui,/useRealtorStore/)
 assert.doesNotMatch(ui,/localStorage/)
 const hook=source('components/realtor-partner-engine/use-realtor-store.ts')
 assert.match(hook,/UNSYNCED/)
 assert.match(hook,/confirmMissingOnly/)
})

test('Realtor API requires signed-in identity and avoids bulk deletes',()=>{
 const api=source('app/api/realtor-partner-engine/records/route.ts')
 assert.match(api,/auth\.getUser\(\)/)
 assert.match(api,/\.eq\('user_id',user\.id\)/)
 assert.match(api,/expectedUpdatedAt/)
 assert.doesNotMatch(api,/\.delete\(/)
})

test('Toolbox AI uses browser time zone in both entry points',()=>{
 for(const path of ['components/ai-workspace.tsx','components/engine-ai-widget.tsx'])
   assert.match(source(path),/Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/)
 assert.match(source('app/api/ai/chat/route.ts'),/localCalendar\(zone\)/)
})

test('Each native tool keeps independent pages and API routes',()=>{
 for(const path of ['app/originator-engine/page.tsx','app/realtor-partner-engine/page.tsx','app/api/originator-engine/activity/route.ts','app/api/realtor-partner-engine/records/route.ts'])
   assert.ok(source(path).length>50,path)
})
