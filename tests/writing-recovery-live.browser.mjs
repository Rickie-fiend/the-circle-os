import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium,expect} from '@playwright/test';
import {createEmptyState,ensureDay,getDateKey} from '../app/os/circle-os-model.js';
import {createChapterRun,chapterRunId} from '../app/os/chapters/chapter-model.js';
import {dayOpenRunId} from '../app/os/day-door.js';
import {prepareWritingOperation,applyWritingOperation} from '../app/os/writing-model.js';
import {enqueueWritingChange} from '../app/os/writing-sync-model.js';
import {writingUploadRequests} from '../app/os/writing-cloud-model.js';

const origin=process.env.CIRCLE_AUTH_LIVE_ORIGIN;
expect.configure({timeout:45000});
const poll=fn=>expect.poll(fn,{timeout:45000});
test('hosted production store recovers accepted writing after full local wipe',{skip:!origin||process.env.CIRCLE_AUTH_LIVE_WRITE!=='approved',timeout:480000},async()=>{
  const host=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,secret=process.env.SUPABASE_SECRET_KEY;
  const allAccounts=[];let browser;
  async function call(path,body,token,admin=false,method='POST'){
    return fetch(host+path,{method,headers:{apikey:admin?secret:key,Authorization:'Bearer '+(admin?secret:token||key),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  }
  async function rpc(name,body,token){const r=await call('/rest/v1/rpc/'+name,body,token);assert.equal(r.ok,true,'RPC '+name+' HTTP '+r.status);return r.json();}
  try{
    browser=await chromium.launch();
    for(const width of [360,390]){
    const accounts=[];
    for(let i=0;i<2;i++){
      const a={email:'writing-recovery-'+randomUUID()+'@example.com',password:randomBytes(32).toString('hex')};
      const r=await call('/auth/v1/admin/users',{...a,email_confirm:true,user_metadata:{alias:'Synthetic recovery'}},null,true);
      assert.equal(r.ok,true,'create temporary account');a.id=(await r.json()).id;accounts.push(a);allAccounts.push(a);
    }
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Bangkok'});
      try{
        let block=false;let interrupted=0;const errors=[];
        await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin===host&&u.pathname.startsWith('/rest/v1/rpc/circle_writing_')&&block){interrupted++;return route.abort();}return [host,origin].includes(u.origin)?route.continue():route.abort();});
        const page=await context.newPage();page.on('pageerror',()=>errors.push('pageerror'));
        await page.addInitScript(()=>{
          window.__recoveryEvents=[];
          for(const type of ['click','submit'])document.addEventListener(type,event=>{
            const target=event.target;
            if(type==='submit'||target.closest?.('button')?.textContent?.trim()==='Send'){
              const form=type==='submit'?target:target.closest('button')?.form;
              window.__recoveryEvents.push({type,at:performance.now(),answerLength:form?.querySelector('textarea')?.value.length??null,disabled:target.closest?.('button')?.disabled??null});
            }
          },true);
        });
        const login=async a=>{await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();};
        const bundle=(id=accounts[0].id)=>page.evaluate(async id=>{
          const db=await new Promise((yes,no)=>{const r=indexedDB.open('circle-os-writing-v1:account:'+id);r.onsuccess=()=>yes(r.result);r.onerror=()=>no(Error('open writing'));});
          try{if(!db.objectStoreNames.contains('writing'))return null;return await new Promise((yes,no)=>{const t=db.transaction('writing'),s=t.objectStore('writing'),out={};for(const [k,v]of Object.entries({state:'records',queue:'sync-v1',cloud:'cloud-v1'})){const r=s.get(v);r.onsuccess=()=>out[k]=r.result;}t.oncomplete=()=>yes(out);t.onabort=()=>no(Error('read writing'));});}finally{db.close();}
        },id);
        const token=()=>page.evaluate(p=>JSON.parse(localStorage.getItem(p+':session')).access_token,'circle-os-auth:'+new URL(host).host);
        const seed=ensureDay(createEmptyState(),getDateKey());
        for(const name of ['index','sparks'])for(const c of JSON.parse(await readFile(new URL('../app/os/chapters/published/'+name+'.json',import.meta.url),'utf8')).chapters){const run={...createChapterRun(c),status:'completed',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),currentPageId:c.pages.at(-1).id,furthestPageId:c.pages.at(-1).id};seed.chapters.runs[chapterRunId(c)]=run;if(c.id==='day-open'){const id=dayOpenRunId(c,getDateKey());seed.chapters.runs[id]={...run,runId:id};}}
        const enterTools=async()=>{await page.goto(origin+'/brand');await page.evaluate(({id,state})=>localStorage.setItem('circle-os-state-v2:account:'+id,JSON.stringify({savedAt:new Date().toISOString(),state})),{id:accounts[0].id,state:seed});await page.goto(origin+'/os');await page.getByRole('button',{name:'Note',exact:true}).click();};
        const wipe=async()=>{await page.goto('about:blank');const cdp=await context.newCDPSession(page);await cdp.send('Storage.clearDataForOrigin',{origin,storageTypes:'all'});await page.goto(origin+'/os');};
        await page.goto(origin+'/os');await login(accounts[0]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();await enterTools();
        const note='Accepted synthetic Note '+width,thought='Accepted synthetic Thought '+width;
        await page.getByRole('textbox',{name:'Write a note',exact:true}).fill(note);
        await poll(async()=>Object.values((await bundle())?.state?.entries||{}).some(e=>e.versions.at(-1).content.body===note)).toBe(true);
        await page.getByRole('button',{name:'Open Deep Thoughts',exact:true}).click();
        await page.getByRole('textbox',{name:'Answer the deep thought',exact:true}).fill(thought);await page.getByRole('button',{name:'Send',exact:true}).click();
        try{
          await poll(async()=>Object.values((await bundle())?.state?.entries||{}).some(e=>e.versions.at(-1).content.body===thought)).toBe(true);
        }catch(error){
          const b=await bundle();
          console.log('Send diagnostic',JSON.stringify({width,events:await page.evaluate(()=>window.__recoveryEvents),ui:await page.evaluate(()=>({answerLength:document.querySelector('[aria-label="Answer the deep thought"]')?.value.length,buttons:[...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Send').map(b=>({disabled:b.disabled,formPresent:Boolean(b.form)})),alerts:[...document.querySelectorAll('[role="alert"]')].map(e=>e.textContent)})),entries:Object.keys(b?.state?.entries||{}).length,drafts:Object.values(b?.state?.drafts||{}).map(d=>({length:d.content?.body?.length})),pending:Object.keys(b?.queue?.pending||{}).length,errors}));
          throw error;
        }
        await poll(async()=>Object.keys((await bundle())?.queue?.pending||{}).length).toBe(0);
        const accepted=await bundle(),auth=await token();
        const heads=await rpc('circle_writing_inventory',{after_id:''},auth);
        for(const entry of Object.values(accepted.state.entries))assert.deepEqual(heads.find(h=>h.entryId===entry.id)?.snapshot.entry,entry);
        assert.ok(Object.keys(accepted.queue.acknowledgements).length>0,'exact receipts persisted');
        await page.getByRole('button',{name:'Open Note',exact:true}).click();block=true;
        await page.getByRole('textbox',{name:'Write a note',exact:true}).fill('Unaccepted local edit '+width);
        await poll(async()=>Object.values((await bundle()).state.entries).some(e=>e.versions.at(-1).content.body==='Unaccepted local edit '+width)).toBe(true);
        await page.getByRole('button',{name:'Open Deep Thoughts',exact:true}).click();
        await page.getByRole('button',{name:'Next question',exact:true}).click();
        await page.getByRole('textbox',{name:'Answer the deep thought',exact:true}).fill('Unsent local answer '+width);
        await poll(async()=>Object.values((await bundle()).state.drafts).some(d=>d.content?.body==='Unsent local answer '+width)).toBe(true);
        await wipe();await login(accounts[0]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();await enterTools();
        await poll(()=>interrupted).toBeGreaterThan(0);
        assert.deepEqual((await bundle())?.state?.entries||{}, {},'interrupted restore fabricates no writing');
        block=false;await page.reload();
        await poll(async()=>Object.keys((await bundle())?.state?.entries||{}).length).toBe(Object.keys(accepted.state.entries).length);
        assert.deepEqual((await bundle()).state.entries,accepted.state.entries);
        assert.equal(JSON.stringify((await bundle()).state).includes('Unsent local answer'),false);
        assert.equal(JSON.stringify((await bundle()).state).includes('Unaccepted local edit'),false);
        await page.goto(origin+'/os#note');
        await page.locator('.os-note-page').getByRole('button',{name:'History',exact:true}).click();
        await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        await page.locator('.os-note-page .os-writing-entry').first().click();
        await expect(page.getByRole('textbox',{name:'Write a note',exact:true})).toHaveValue(note);
        await page.getByRole('textbox',{name:'Write a note',exact:true}).fill('');
        await poll(async()=>Object.values((await bundle())?.state?.entries||{}).some(e=>e.kind==='note'&&e.versions.at(-1).content.body==='')).toBe(true);
        await poll(async()=>Object.keys((await bundle())?.queue?.pending||{}).length).toBe(0);
        const cleared=Object.values((await bundle()).state.entries).find(e=>e.kind==='note');
        const clearingHeads=await rpc('circle_writing_inventory',{after_id:''},await token());
        assert.deepEqual(clearingHeads.find(h=>h.entryId===cleared.id)?.snapshot.entry,cleared,'server accepts dated empty revision and history');
        await wipe();await login(accounts[0]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();await enterTools();
        await poll(async()=>Boolean((await bundle())?.state?.entries?.[cleared.id])).toBe(true);
        assert.deepEqual((await bundle()).state.entries[cleared.id],cleared,'cleared writing restores empty with original history');
        // Terminal deletion through the same model/queue protocol; UI recovery
        // and the production runner must suppress a captured stale ledger.
        let deleted=await bundle();const entry=Object.values(deleted.state.entries).find(e=>e.kind==='note');
        const stale=structuredClone(deleted);
        for(const type of ['trash','delete']){const command=await prepareWritingOperation({owner:deleted.state.owner,operationId:randomUUID(),at:new Date().toISOString(),type,entryId:entry.id,expectedGeneration:deleted.state.entries[entry.id].generation,confirmed:true});const result=applyWritingOperation(deleted.state,command);deleted={...deleted,state:result.state,queue:enqueueWritingChange(deleted.queue,deleted.state,result)};}
        for(const request of await writingUploadRequests(deleted)){const result=await rpc('circle_writing_apply',{request},await token());assert.equal(result.status,'accepted');}
        await page.goto(origin+'/brand');await page.evaluate(async({id,b})=>{const db=await new Promise(yes=>{const r=indexedDB.open('circle-os-writing-v1:account:'+id);r.onsuccess=()=>yes(r.result);});try{await new Promise((yes,no)=>{const t=db.transaction('writing','readwrite'),s=t.objectStore('writing');s.put(b.state,'records');s.put(b.queue,'sync-v1');s.put(b.cloud,'cloud-v1');t.oncomplete=yes;t.onabort=()=>no(Error('write stale fixture'));});}finally{db.close();}},{id:accounts[0].id,b:stale});
        await page.goto(origin+'/os');await poll(async()=>Boolean((await bundle())?.state?.tombstones?.[entry.id])).toBe(true);
        assert.equal(JSON.stringify((await bundle()).state).includes(note),false);
        await wipe();await login(accounts[1]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();
        await poll(async()=>Boolean((await bundle(accounts[1].id))?.state)).toBe(true);
        assert.deepEqual((await bundle(accounts[1].id)).state.entries,{});
        assert.deepEqual(await rpc('circle_writing_inventory',{after_id:''},await token()),[]);
        await wipe();await login(accounts[0]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();await enterTools();
        await poll(async()=>Boolean((await bundle())?.state?.tombstones?.[entry.id])).toBe(true);
        assert.equal(JSON.stringify((await bundle()).state).includes(note),false);
        assert.deepEqual(errors,[]);console.log('PASS actual-store hosted recovery, interruption, local-only loss, deletion and isolation '+width+'px');
      }catch(error){console.log('Synthetic recovery UI diagnostic',await pageText(context));throw error;}finally{await context.close();}
    }
  }finally{
    await browser?.close();const failures=[];
    await writeFile('outputs/writing-recovery-account-ids.json',JSON.stringify(allAccounts.map(a=>a.id)));
    for(const a of allAccounts){try{const r=await call('/auth/v1/admin/users/'+a.id,null,null,true,'DELETE');assert.ok(r.ok);assert.equal((await call('/auth/v1/admin/users/'+a.id,null,null,true,'GET')).status,404);}catch{failures.push(a.id);}}
    assert.deepEqual(failures,[],'temporary accounts removed');console.log('Temporary account deletion confirmed; writing-table absence requires scoped SQL check.');
  }
});
async function pageText(context){return context.pages().at(-1)?.locator('body').innerText().catch(()=> 'unavailable');}
