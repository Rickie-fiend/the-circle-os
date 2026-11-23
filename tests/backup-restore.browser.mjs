import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {chromium,expect as baseExpect} from '@playwright/test';
import {createEmptyState,ensureDay,getDateKey} from '../app/os/circle-os-model.js';
import {createChapterRun,chapterRunId} from '../app/os/chapters/chapter-model.js';
import {dayOpenRunId} from '../app/os/day-door.js';

const expect=baseExpect.configure({timeout:45000});
test('reconciled synthetic restore renders surviving writing at 360/390px',{skip:!process.env.CIRCLE_BACKUP_RESTORE_INPUT,timeout:180000},async()=>{
  const {origin,host,account,other}=JSON.parse(await readFile(process.env.CIRCLE_BACKUP_RESTORE_INPUT,'utf8'));
  for(const url of [origin,host])assert.equal(new URL(url).hostname,'127.0.0.1','local endpoints only');
  const browser=await chromium.launch();
  try{
    for(const width of [360,390]){
      const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Bangkok'});
      try{
        await context.route('**/*',route=>[origin,host].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
        const page=await context.newPage(),errors=[];page.on('pageerror',()=>errors.push('pageerror'));
        const login=async a=>{
          await page.goto(origin+'/os');await page.getByLabel('Email',{exact:true}).fill(a.email);await page.getByLabel('Password',{exact:true}).fill(a.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
          await expect(page.getByRole('heading',{name:/^(Start with what matters\.|What shall we call you\?)$/})).toBeVisible();
          if(await page.getByRole('heading',{name:'What shall we call you?'}).isVisible()){await page.getByLabel('Alias',{exact:true}).fill('Synthetic restore');await page.getByRole('button',{name:'Continue',exact:true}).click();}
          await expect(page.getByRole('heading',{name:'Start with what matters.'})).toBeVisible();
        };
        await login(account);
        const seed=ensureDay(createEmptyState(),getDateKey());
        for(const name of ['index','sparks'])for(const c of JSON.parse(await readFile(new URL('../app/os/chapters/published/'+name+'.json',import.meta.url),'utf8')).chapters){
          const run={...createChapterRun(c),status:'completed',completedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),currentPageId:c.pages.at(-1).id,furthestPageId:c.pages.at(-1).id};seed.chapters.runs[chapterRunId(c)]=run;if(c.id==='day-open'){const id=dayOpenRunId(c,getDateKey());seed.chapters.runs[id]={...run,runId:id};}
        }
        await page.goto(origin+'/brand');await page.evaluate(({id,state})=>localStorage.setItem('circle-os-state-v2:account:'+id,JSON.stringify({savedAt:new Date().toISOString(),state})),{id:account.id,state:seed});
        await page.goto(origin+'/os');await page.getByRole('button',{name:'Note',exact:true}).click();
        const entries=()=>page.evaluate(async id=>{
          const db=await new Promise((yes,no)=>{const r=indexedDB.open('circle-os-writing-v1:account:'+id);r.onsuccess=()=>yes(r.result);r.onerror=()=>no(Error('open'));});
          try{if(!db.objectStoreNames.contains('writing'))return {};return await new Promise((yes,no)=>{const r=db.transaction('writing').objectStore('writing').get('records');r.onsuccess=()=>yes(r.result?.entries||{});r.onerror=()=>no(Error('read'));});}finally{db.close();}
        },account.id);
        await expect.poll(async()=>Object.keys(await entries()).length).toBe(5);
        await page.locator('.os-note-page').getByRole('button',{name:'History',exact:true}).click();await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        const rows=page.locator('.os-note-page .os-writing-entry');await expect(rows).toHaveCount(2);
        await expect(rows.filter({hasText:'Synthetic deleted-later'})).toHaveCount(0);
        await rows.filter({hasText:'Restored note'}).click();
        await expect(page.getByRole('textbox',{name:'Write a note',exact:true})).toHaveValue('Synthetic restored Note revision two');
        await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        await page.locator('.os-note-page').getByRole('button',{name:'History',exact:true}).click();await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        await rows.filter({hasText:'Untitled'}).click();await expect(page.getByRole('textbox',{name:'Write a note',exact:true})).toHaveValue('');
        await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        await page.getByRole('button',{name:'Open Deep Thoughts',exact:true}).click();
        await page.locator('.os-deep-thoughts-page').getByRole('button',{name:'History',exact:true}).click();await expect(page.locator('.os-deep-thoughts-page')).not.toHaveClass(/os-app-flip/);
        await page.locator('.os-deep-thoughts-page .os-writing-entry').filter({hasText:'Synthetic backup question'}).click();
        await expect(page.getByRole('textbox',{name:'Answer the deep thought',exact:true})).toHaveValue('Synthetic restored answer');
        const records=await entries();assert.equal(records.note.versions.at(-1).content.body,'Synthetic restored Note revision two');assert.equal(records.cleared.versions.at(-1).content.body,'');assert.equal(records.thought.versions.at(-1).content.body,'Synthetic restored answer');
        assert.equal(records['deleted-later'],undefined,'deleted text never enters the fresh device store');
        assert.equal(records.trashed.status,'trashed','ordinary Trash stays recoverable');
        await page.reload();await expect.poll(async()=>(await entries()).note?.versions.at(-1).content.body).toBe('Synthetic restored Note revision two');
        await page.goto('about:blank');const cdp=await context.newCDPSession(page);await cdp.send('Storage.clearDataForOrigin',{origin,storageTypes:'all'});
        await login(other);
        await page.goto(origin+'/brand');await page.evaluate(({id,state})=>localStorage.setItem('circle-os-state-v2:account:'+id,JSON.stringify({savedAt:new Date().toISOString(),state})),{id:other.id,state:seed});
        await page.goto(origin+'/os');await page.getByRole('button',{name:'Note',exact:true}).click();
        await page.locator('.os-note-page').getByRole('button',{name:'History',exact:true}).click();
        await expect(page.locator('.os-note-page')).not.toHaveClass(/os-app-flip/);
        await expect(page.locator('.os-note-page')).toContainText('No saved writing yet.');
        assert.deepEqual(errors,[]);console.log('PASS restored app, reload and account switch '+width+'px');
      }finally{await context.close();}
    }
  }finally{await browser.close();}
});
