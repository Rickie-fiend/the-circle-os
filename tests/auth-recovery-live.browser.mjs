import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
import { createEmptyState, ensureDay, getDateKey } from '../app/os/circle-os-model.js';
import { createChapterRun, chapterRunId } from '../app/os/chapters/chapter-model.js';
import { dayOpenRunId } from '../app/os/day-door.js';
import { setTimeout as pause } from 'node:timers/promises';

const origin=process.env.CIRCLE_AUTH_LIVE_ORIGIN;
const naturalExpiry=process.env.CIRCLE_AUTH_NATURAL_EXPIRY==='yes';
expect.configure({ timeout: 30000 });
test('hosted sessions preserve production writing',{skip:!origin||process.env.CIRCLE_AUTH_LIVE_WRITE!=='approved',timeout:naturalExpiry?7500000:300000},async()=>{
  const host=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, secret=process.env.SUPABASE_SECRET_KEY;
  const accounts=[]; let browser;
  async function call(path,body,token,admin=false,method='POST') {
    return fetch(host+path,{method,headers:{apikey:admin?secret:key,Authorization:'Bearer '+(admin?secret:token||key),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  }
  try {
    for(let i=0;i<2;i++){
      const account={email:'auth-recovery-'+randomUUID()+'@example.com',password:randomBytes(32).toString('hex')};
      const response=await call('/auth/v1/admin/users',{...account,email_confirm:true,user_metadata:{alias:'Synthetic recovery'}},null,true);
      assert.equal(response.status,200,'create isolated account'); account.id=(await response.json()).id; accounts.push(account);
    }
    browser=await chromium.launch();
    for(const width of naturalExpiry?[390]:[360,390]){
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true});
      const errors=[];
      let page=await context.newPage(); page.on('pageerror',()=>errors.push('pageerror'));
      await context.route('**/*',route=>{const u=new URL(route.request().url());return [origin,host].includes(u.origin)?route.continue():route.abort();});
      const prefix='circle-os-auth:'+new URL(host).host;
      const login=async a=>{await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();};
      const logout=async()=>{await page.getByRole('button',{name:'Open account',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();};
      const session=()=>page.evaluate(p=>JSON.parse(localStorage.getItem(p+':session')),prefix);
      const ledger=()=>page.evaluate(async id=>{const db=await new Promise((yes,no)=>{const r=indexedDB.open('circle-os-writing-v1:account:'+id);r.onsuccess=()=>yes(r.result);r.onerror=()=>no(Error('open'));});try{return await new Promise((yes,no)=>{const r=db.transaction('writing').objectStore('writing').get('records');r.onsuccess=()=>yes(r.result);r.onerror=()=>no(Error('read'));});}finally{db.close();}},accounts[0].id);
      await page.goto(origin+'/os');await login(accounts[0]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();
      const seed=ensureDay(createEmptyState(),getDateKey());
      for(const name of ['index','sparks'])for(const c of JSON.parse(await readFile(new URL('../app/os/chapters/published/'+name+'.json',import.meta.url),'utf8')).chapters){const run={...createChapterRun(c),status:'completed',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),currentPageId:c.pages.at(-1).id,furthestPageId:c.pages.at(-1).id};seed.chapters.runs[chapterRunId(c)]=run;if(c.id==='day-open'){const id=dayOpenRunId(c,getDateKey());seed.chapters.runs[id]={...run,runId:id};}}
      await page.evaluate(({id,state})=>localStorage.setItem('circle-os-state-v2:account:'+id,JSON.stringify({savedAt:new Date().toISOString(),state})),{id:accounts[0].id,state:seed});await page.reload();
      await page.getByRole('button',{name:'Note',exact:true}).click();await page.getByRole('textbox',{name:'Write a note',exact:true}).fill('Hosted harmless note '+width);
      await expect.poll(async()=>Object.values((await ledger()).entries).some(e=>e.versions.at(-1).content.body==='Hosted harmless note '+width)).toBe(true);
      await page.getByRole('button',{name:'Open Deep Thoughts',exact:true}).click();await page.getByRole('textbox',{name:'Answer the deep thought',exact:true}).fill('Unfinished hosted answer '+width);
      await expect.poll(async()=>Object.values((await ledger()).drafts).some(d=>d.content?.body==='Unfinished hosted answer '+width)).toBe(true);
      await page.getByRole('textbox',{name:'Answer the deep thought',exact:true}).blur();
      const before=await ledger();
      await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
      await context.setOffline(true);await page.reload();
      await expect(page.getByRole('textbox',{name:'Answer the deep thought',exact:true})).toHaveValue('Unfinished hosted answer '+width);
      assert.deepEqual((await ledger()).entries,before.entries);
      if(naturalExpiry){
        const issued=await session();
        const claims=JSON.parse(Buffer.from(issued.access_token.split('.')[1],'base64url').toString());
        assert.ok(Number.isFinite(claims.exp));
        const until=claims.exp*1000+5000;
        assert.ok(until-Date.now()<7200000,'natural expiry within two-hour test bound');
        console.log('Waiting offline for natural signed-token expiry; seconds remaining '+Math.ceil((until-Date.now())/1000));
        while(Date.now()<until){await pause(Math.min(30000,until-Date.now()));console.log('Natural expiry wait: '+Math.max(0,Math.ceil((until-Date.now())/1000))+' seconds remaining');}
        assert.ok(Date.now()>claims.exp*1000,'issued signed token has naturally expired');
        assert.ok((await session()).access_token===issued.access_token,'no token replacement while offline');
        await page.close();page=await context.newPage();page.on('pageerror',()=>errors.push('pageerror'));
        const response=await page.goto(origin+'/os#thoughts');assert.equal(response.fromServiceWorker(),true,'offline reopening served by service worker');
        await expect(page.getByRole('textbox',{name:'Answer the deep thought',exact:true})).toHaveValue('Unfinished hosted answer '+width);
        await page.getByRole('button',{name:'Open Note',exact:true}).click();await expect(page.getByRole('textbox',{name:'Write a note',exact:true})).toHaveValue('Hosted harmless note '+width);
        assert.deepEqual((await ledger()).entries,before.entries);assert.deepEqual((await ledger()).drafts,before.drafts);
        await context.setOffline(false);await page.reload();
        await expect(page.getByRole('textbox',{name:'Write a note',exact:true})).toHaveValue('Hosted harmless note '+width);
        const renewed=await session();assert.ok(renewed.access_token!==issued.access_token,'expired token renewed on reconnect');
        const renewedClaims=JSON.parse(Buffer.from(renewed.access_token.split('.')[1],'base64url').toString());
        assert.ok(renewedClaims.exp*1000>Date.now(),'replacement signed token is unexpired');
        assert.deepEqual((await ledger()).entries,before.entries);assert.deepEqual((await ledger()).drafts,before.drafts);
        console.log('PASS natural signed-token expiry, offline reopening and hosted renewal at 390px');
      }
      await context.setOffline(false);
      if(naturalExpiry)await page.getByRole('button',{name:'Open Deep Thoughts',exact:true}).click();
      await expect(page.getByRole('button',{name:'Open Note',exact:true})).toBeVisible();
      const old=await session();
      // Request real renewal early through persisted SDK scheduling metadata.
      // The signed JWT is unchanged; this does NOT certify natural JWT expiry.
      await page.evaluate(p=>{const s=JSON.parse(localStorage.getItem(p+':session'));s.expires_at=1;localStorage.setItem(p+':session',JSON.stringify(s));},prefix);
      await page.reload();await expect(page.getByRole('button',{name:'Open Note',exact:true})).toBeVisible();
      assert.ok((await session()).refresh_token!==old.refresh_token,'hosted refresh rotates token');
      assert.deepEqual((await ledger()).entries,before.entries);
      const current=await session();
      const revoke=await call('/auth/v1/logout?scope=global',null,current.access_token);assert.equal(revoke.status,204,'revoke this synthetic account sessions');
      const refresh=await call('/auth/v1/token?grant_type=refresh_token',{refresh_token:current.refresh_token});assert.equal(refresh.ok,false,'revoked refresh denied');
      const user=await call('/auth/v1/user',null,current.access_token,false,'GET');
      console.log('Hosted access-token /user after revocation: HTTP '+user.status+'; signed token remaining seconds '+Math.max(0,current.expires_at-Math.floor(Date.now()/1000)));
      await page.evaluate(p=>{const s=JSON.parse(localStorage.getItem(p+':session'));s.expires_at=1;localStorage.setItem(p+':session',JSON.stringify(s));},prefix);
      await page.reload();await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();assert.deepEqual((await ledger()).entries,before.entries);assert.deepEqual((await ledger()).drafts,before.drafts);
      await login(accounts[1]);await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();assert.equal(await page.getByRole('textbox').count(),0);
      await logout();await login(accounts[0]);await expect(page.getByRole('button',{name:'Open Note',exact:true})).toBeVisible();assert.deepEqual((await ledger()).entries,before.entries);assert.deepEqual((await ledger()).drafts,before.drafts);
      assert.deepEqual(errors,[]);await context.close();console.log('PASS hosted renewal/revocation/account separation '+width+'px');
    }
  } finally {
    await browser?.close();const failures=[];
    for(const a of accounts){try{const r=await call('/auth/v1/admin/users/'+a.id,null,null,true,'DELETE');assert.ok(r.ok);const check=await call('/auth/v1/admin/users/'+a.id,null,null,true,'GET');assert.equal(check.status,404);}catch{failures.push(a.id);}}
    assert.deepEqual(failures,[],'exact synthetic cleanup');console.log('Synthetic account cleanup confirmed.');
  }
});
