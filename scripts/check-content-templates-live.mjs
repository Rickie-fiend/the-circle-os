import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createTemplateDraft, createTemplateItem, createTemplatePage, fixedValue } from '../app/os/admin/template-model.js';
import { createEmptyState, CIRCLE_OS_STORAGE_KEY } from '../app/os/circle-os-model.js';
import { createChapterRun, chapterRunId } from '../app/os/chapters/chapter-model.js';

// Called only by the existing explicitly write-gated runner. All identities,
// assets and receipts are registered with its exact-fixture cleanup first.
export async function verifyLiveTemplates({tag,a,b,assetId,fixtureIds,operation,call,ok,change,read,http,origin,appOrigin}) {
  const published=[];
  for(const kind of ['routine','protocol']) {
    const draft=createTemplateDraft(kind);draft.draftId=`${tag}-${kind}`;fixtureIds.push(draft.draftId);
    draft.template.title=`Synthetic ${kind} ${tag.slice(-8)}`;draft.template.description='Synthetic template acceptance only.';draft.template.cover={assetId,alt:'Synthetic template pixel'};draft.template.items[0].action='Read one page';
    if(kind==='routine') {draft.template.items[0].cue=fixedValue('After breakfast');draft.template.items.push({...createTemplateItem('task'),action:'Water a plant',cue:fixedValue('At seven')});}
    const question={...createTemplatePage('short-text'),question:'Why choose this practice?',purpose:'reflection'};draft.template.pages.push(question);
    const save=(value,revision)=>call('/rest/v1/rpc/circle_save_content_draft',{method:'POST',token:a.token,body:{draft:value,expected_revision:revision,operation_id:operation()}});
    await ok(await save(draft,0),`save synthetic ${kind} template`);
    const command={action:'publish',id:draft.draftId,draftId:draft.draftId,draftRevision:1,draft,expectedRevision:0,operationId:operation()};
    assert.ok(!(await change(command,b.token)).ok, 'ordinary account cannot publish templates');
    await ok(await http('admin/publications',a.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(command)}),`publish synthetic ${kind} v1 through production HTTP`);
    const original=await(await ok(await read(draft.draftId,1),`read ${kind} v1`)).json();
    const replay=await(await ok(await change(command),`replay ${kind} publication receipt`)).json();assert.equal(replay.version,1);
    const next=structuredClone(draft);next.template.title+=' next';await ok(await save(next,1),`save ${kind} v2 draft`);
    await ok(await http('admin/publications',a.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...command,draft:next,draftRevision:2,expectedRevision:1,operationId:operation()})}),`publish ${kind} v2 through production HTTP`);
    assert.deepEqual(await(await ok(await read(draft.draftId,1),`${kind} v1 remains immutable`)).json(),original);
    const edition=await(await ok(await http(`catalog?id=${draft.draftId}&version=2`),`production HTTP ${kind} exact reader`)).json();assert.deepEqual(edition.content.template,next.template);
    published.push({id:draft.draftId,title:next.template.title,kind});
  }
  const summaries=await(await ok(await http('catalog?view=explore'), 'production HTTP Explore metadata')).json();
  for(const item of published){const summary=summaries.find(row=>row.id===item.id);assert.equal(summary.title,item.title);assert.equal(summary.version,2);assert.equal(summary.cover.assetId,assetId);assert.equal(summary.description,'Synthetic template acceptance only.');}
  assert.equal((await http('catalog?view=explore',null)).status,403,'unsigned Explore listing is denied');
  await verifyBrowser({b,published,origin,appOrigin});
  for(const item of published) {
    await ok(await change({action:'withdraw',id:item.id,expectedRevision:2,operationId:operation()}),`withdraw synthetic ${item.kind}`);
    const hidden=await(await ok(await http('catalog?view=explore',a.token),'Admin Explore also hides withdrawn templates')).json();assert.ok(!hidden.some(row=>row.id===item.id));
    assert.equal((await(await ok(await read(item.id,2),'withdrawn exact version remains readable')).json()).content.template.title,item.title);
    await ok(await change({action:'restore',id:item.id,expectedRevision:3,operationId:operation()}),`restore synthetic ${item.kind}`);
  }
}

async function verifyBrowser({b,published,origin,appOrigin}) {
  const {chromium,expect}=await import('@playwright/test');
  const browser=await chromium.launch();
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Asia/Bangkok',serviceWorkers:'block'});
    const errors=[],external=[];
    context.on('page',page=>page.on('pageerror',error=>{if(!error.message.includes('ResizeObserver'))errors.push(error.name+': '+error.message.replace(/https?:\/\/\S+/g,'[URL]').replace(/eyJ[A-Za-z0-9._-]+/g,'[TOKEN]'));}));
    await context.route('**/*',route=>{const target=new URL(route.request().url()).origin;if(target!==appOrigin&&target!==new URL(origin).origin){external.push('Unexpected external request');return route.abort();}return route.continue();});
    const state=createEmptyState(),definitions=JSON.parse(await readFile(new URL('../app/os/chapters/published/index.json',import.meta.url),'utf8')).chapters;
    const dayOne=definitions.filter(chapter=>chapter.id==='day-one').sort((left,right)=>right.version-left.version)[0];assert.ok(dayOne,'seed only the existing synthetic Day One gate');
    const run=createChapterRun(dayOne),at=new Date().toISOString(),last=dayOne.pages.at(-1).id;
    state.chapters.runs[chapterRunId(dayOne)]={...run,status:'completed',completedAt:at,currentPageId:last,furthestPageId:last};
    const stateKey=`${CIRCLE_OS_STORAGE_KEY}:account:${b.id}`,authKey=`circle-os-auth:${new URL(origin).host}:session`;
    // These values stay in the isolated browser context; never emit a storage
    // dump or trace, which could expose its short-lived session credentials.
    await context.addInitScript(({authKey,stateKey,session,state,at,appOrigin})=>{if(location.origin!==appOrigin)return;if(!sessionStorage.getItem('synthetic-template-seeded')){localStorage.setItem(authKey,JSON.stringify(session));localStorage.setItem(stateKey,JSON.stringify({savedAt:at,state}));sessionStorage.setItem('synthetic-template-seeded','yes');}},{authKey,stateKey,session:b.session,state,at,appOrigin});
    const page=await context.newPage();page.setDefaultTimeout(30000);await page.goto(appOrigin+'/os/explore');
    const routine=published.find(item=>item.kind==='routine'),protocol=published.find(item=>item.kind==='protocol');
    const openItem=async item=>{await page.locator(`.os-explore-open[href="/os/catalog/read?id=${item.id}&version=2"]`).click();await page.getByRole('button',{name:'Open Begin',exact:true}).click();await page.getByRole('textbox',{name:'Why choose this practice?',exact:true}).fill('Synthetic chosen reflection');await page.getByRole('button',{name:'Continue',exact:true}).click();};
    await openItem(routine);await page.getByRole('button',{name:'Add to Routine',exact:true}).click();await page.waitForURL('**/os#routine');
    const habit=page.locator('.os-repeated-habit').filter({has:page.getByRole('textbox',{name:'Edit habit: Read one page',exact:true})});
    await habit.getByRole('button',{name:'Mark done: Read one page',exact:true}).click();
    await expect.poll(()=>page.evaluate(key=>Object.values(JSON.parse(localStorage.getItem(key)).state.habits.completions).some(record=>record.completed),stateKey)).toBe(true);
    await page.reload();await expect(page.getByRole('button',{name:'Undo: Read one page',exact:true})).toBeVisible();
    await habit.locator('.os-template-source > summary').click();await expect(habit.locator('.os-template-source-copy')).toContainText('Synthetic chosen reflection');
    let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,stateKey);assert.equal(Object.keys(saved.templateAdoptions).length,1);assert.equal(Object.values(saved.templateAdoptions)[0].schedule.days,21);
    await page.getByRole('link',{name:'Explore',exact:true}).click();await openItem(protocol);await page.getByRole('button',{name:'Preview',exact:true}).click();await page.getByRole('button',{name:'Start',exact:true}).click();await page.waitForURL('**/os#protocol');
    await page.getByRole('button',{name:'Keep: Read one page',exact:true}).click();
    await expect.poll(()=>page.evaluate(key=>Object.values(JSON.parse(localStorage.getItem(key)).state.protocol.completions).some(record=>record.completed),stateKey)).toBe(true);
    await page.reload();await expect(page.getByRole('button',{name:'Undo: Read one page',exact:true})).toBeVisible();
    saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).state,stateKey);assert.equal(Object.keys(saved.templateAdoptions).length,1);assert.equal(Object.keys(saved.protocol.runs).length,1);assert.equal(Object.values(saved.protocol.runs)[0].sourceTemplate.version,2);
    assert.deepEqual(errors,[],'no uncaught product errors');assert.deepEqual(external,[],'only the local app and the intended hosted project are contacted');
    console.log('PASS real hosted Explore → Routine/Protocol → completion → reload in isolated browser');
  } finally {await browser.close();}
}
