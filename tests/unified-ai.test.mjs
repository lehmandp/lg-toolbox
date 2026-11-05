import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8')

test('one assistant interface preserves saved conversations and projects',()=>{
 const ui=read('components/ai-workspace.tsx')
 assert.doesNotMatch(ui,/Assistant mode/)
 assert.match(ui,/Recent chats/)
 assert.match(ui,/Projects/)
 assert.match(ui,/Use my Toolbox module data/)
 assert.match(ui,/Copy research prompt/)
 assert.match(ui,/chatgpt\.com/)
})

test('module widgets use one Auto backend with opt-in context',()=>{
 const widget=read('components/engine-ai-widget.tsx')
 assert.match(widget,/const mode='Auto'/)
 assert.match(widget,/useData/)
 assert.match(widget,/engineContext/)
})

test('executive assistant reads only authenticated source modules',()=>{
 const route=read('app/api/ai/chat/route.ts')
 assert.match(route,/useModuleData===true/)
 assert.match(route,/realtor_relationships/)
 assert.match(route,/originator_engine_activity_entries/)
 assert.match(route,/eq\('user_id',user\.id\)/)
 assert.doesNotMatch(route,/web_search/)
})

test('CSV export works as native feature without AI',()=>{
 const hook=read('components/realtor-partner-engine/use-realtor-store.ts')
 const ui=read('components/realtor-partner-engine/client.tsx')
 assert.match(hook,/function exportCsv/)
 assert.match(ui,/Export CSV/)
})
