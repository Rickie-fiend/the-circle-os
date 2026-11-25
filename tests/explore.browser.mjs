import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium, expect } from '@playwright/test';

const production = process.env.CIRCLE_PRODUCTION_CSS === '1';
const styles = production ? [...new Set(['.next/server/app/os.html', '.next/server/app/os/explore.html'].flatMap(path => [...readFileSync(path, 'utf8').matchAll(/href="(\/_next\/static\/[^"?]+\.css)(?:\?[^" ]*)?"/g)].map(match => match[1])))].map(path => readFileSync(`.next${path.slice('/_next'.length)}`, 'utf8')).join('\n') : '';
let server, browser, base;

const harness = `
import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import{AppRouterContext}from'next/dist/shared/lib/app-router-context.shared-runtime.js';
import{PathnameContext}from'next/dist/shared/lib/hooks-client-context.shared-runtime.js';
import{CircleStateProvider,OSFrame,TodayExperience,useCircleState}from'/app/os/circle-os-shell.tsx';
import Explore from'/app/os/explore/page.tsx';
import{SupabaseConnection}from'/app/os/auth/supabase-context.tsx';
import{AccountContext}from'/app/os/auth/account-context.tsx';
import{activateAccountScope,getAccountScope}from'/app/os/account-scope.js';
import{createEmptyState}from'/app/os/circle-os-model.js';
import{saveCircleState}from'/app/os/circle-os-store.ts';
${production ? '' : "import'/app/globals.css';import'/app/os/os-app.css';import'/app/os/content-glass.css';"}
activateAccountScope('synthetic-explore');await saveCircleState(getAccountScope(),createEmptyState());
const connection={client:{auth:{getSession:async()=>({data:{session:{access_token:'synthetic-token',user:{id:getAccountScope().accountId}}}})}},config:{}};
const account={accountId:'synthetic-explore',alias:'Synthetic',busy:false,message:'',saveAlias:async()=>true,signOut:async()=>{}};
function Probe(){window.exploreState=useCircleState().state;return null;}
function Root(){const[path,setPath]=useState('/os/explore');const move=p=>{history.replaceState(null,'',p);setPath(p);};const router={push:move,replace:move,prefetch:()=>Promise.resolve(),refresh(){},back(){move('/os');},forward(){}};
const surface=React.createElement(CircleStateProvider,null,React.createElement(Probe),React.createElement(OSFrame,null,path==='/os/explore'?React.createElement(Explore):React.createElement(TodayExperience)));
return React.createElement(SupabaseConnection.Provider,{value:connection},React.createElement(AccountContext.Provider,{value:account},React.createElement(AppRouterContext.Provider,{value:router},React.createElement(PathnameContext.Provider,{value:path},surface))));}
window.switchExploreAccount=activateAccountScope;createRoot(document.getElementById('root')).render(React.createElement(Root));
`;

before(async () => {
  server = await createServer({configFile:false,define:{'process.env':JSON.stringify({NODE_ENV:'development'})},plugins:[{
    name:'explore-fixture',enforce:'pre',resolveId(id){if(id==='virtual:explore')return '\0explore-fixture.tsx';},
    load(id){if(id==='\0explore-fixture.tsx')return harness;if(production&&id.endsWith('/app/os/explore/explore.css'))return '';},
    configureServer(vite){vite.middlewares.use(async(req,res,next)=>{
      if(req.url==='/fixture-production.css'){res.setHeader('Content-Type','text/css; charset=utf-8');res.end(styles);return;}
      if(!req.url?.startsWith('/fixture'))return next();
      res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await vite.transformIndexHtml('/fixture','<meta name="viewport" content="width=device-width,initial-scale=1">'+(production?'<link rel="stylesheet" href="/fixture-production.css">':'')+'<div id="root"></div><script type="module" src="/@id/virtual:explore"></script>'));
    });},
  },react()],server:{host:'127.0.0.1',port:0,watch:{ignored:['**/.next/**','**/dist/**']}}});
  await server.listen();base=`http://127.0.0.1:${server.httpServer.address().port}`;browser=await chromium.launch();
});
after(async()=>{await browser?.close();await server?.close();});

const asset='33333333-3333-4333-8333-333333333333';
const catalog = [
  ...Array.from({length:4},(_,i)=>({id:`chapter-${i}`,kind:'chapter',version:2,title:`Synthetic chapter ${i+1}`,description:i===1?'':`A saved cover description ${i+1}.`,...(i===0?{cover:{assetId:asset,alt:'Synthetic landscape'}}:{})})),
  {id:'habit',kind:'routine-template',version:1,title:'Synthetic habit',description:'A saved habit description.'},
  {id:'protocol',kind:'protocol-template',version:3,title:'Synthetic Protocol'},
  {id:'article',kind:'article',version:1,title:'Synthetic article',description:'A saved article summary.'},
];

async function isolated(width,work,{rows=catalog,reducedMotion='reduce'}={}) {
  const context=await browser.newContext({viewport:{width,height:844},isMobile:width<900,hasTouch:true,reducedMotion,timezoneId:'Asia/Bangkok'});
  const errors=[],calls=[];let response={status:200,rows};
  context.on('page',page=>page.on('pageerror',error=>{if(!error.message.includes('ResizeObserver'))errors.push(error.message);}));
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());if(url.origin!==base)return route.abort();
    if(url.pathname==='/os/admin/status')return route.fulfill({status:403,json:{error:'No synthetic Admin grant'}});
    if(url.pathname==='/os/catalog'){calls.push(route.request().url());return route.fulfill({status:response.status,json:response.rows});}
    if(url.pathname==='/os/catalog/media')return route.fulfill({json:{preview:base+'/synthetic-cover.svg'}});
    if(url.pathname==='/synthetic-cover.svg')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#403E35"/><circle cx="200" cy="100" r="65" fill="#E36B37"/></svg>'});
    if(url.pathname==='/os/catalog/read')return route.fulfill({contentType:'text/html',body:'<main>Selected exact version</main>'});
    return route.continue();
  });
  try {
    const page=await context.newPage();await page.goto(base+'/fixture');await expect(page.getByRole('main',{name:'Explore'})).toHaveAttribute('aria-busy','false');await page.evaluate(()=>document.fonts.ready);
    await work(page,{context,calls,respond:value=>{response=value;}});assert.deepEqual(errors,[]);
  } finally {await context.close();}
}

async function expectSharedPanelShadows(page) {
  const shadow = await page.locator('.os-bottom-nav-pill').evaluate(el => getComputedStyle(el).boxShadow);
  assert.notEqual(shadow, 'none');
  const panelShadows = await page.locator('.os-explore-panel').evaluateAll(panels =>
    panels.map(panel => getComputedStyle(panel).boxShadow));
  assert.deepEqual([...new Set(panelShadows)], [shadow]);
}

for(const width of [360,390,416,1100])test(`Explore uses shared glass and native carousel geometry at ${width}px`,{timeout:90000},()=>isolated(width,async(page,{calls})=>{
  await expect(page.locator('.os-explore-row-title')).toHaveText(['Chapters','Habit/Protocol','Articles']);
  await expect(page.getByRole('navigation',{name:'Circle OS'})).toBeVisible();await expect(page.getByRole('button',{name:'Open account',exact:true})).toBeVisible();
  await expect(page.getByRole('link',{name:'The Circle website'})).toBeVisible();assert.equal(calls.length,1);
  await expect(page.locator('.os-explore .os-page-layout')).toHaveCount(0);
  await expect(page.locator('.os-app-shell')).toHaveCSS('box-shadow','none');
  await expect(page.locator('.os-future-room-background')).toHaveCSS('background-color','rgb(25, 24, 19)');
  const articles=page.locator('.os-explore-row').last();await expect(articles.locator('.os-explore-panel')).toHaveCount(2);await expect(articles.locator('.os-explore-panel').last().locator('a,h3,p,figure')).toHaveCount(0);
  const row=page.getByRole('region',{name:'Chapters',exact:true}),panels=row.locator('.os-explore-panel');
  await expect(page.getByAltText('Synthetic landscape')).toBeVisible();await expect(panels.first()).toHaveCSS('backdrop-filter','blur(12px) saturate(1.2)');
  await expect(panels.first()).toHaveCSS('border-top-color', 'rgba(241, 239, 232, 0.16)');
  assert.match(await panels.first().evaluate(el => getComputedStyle(el, '::after').backgroundImage), /rgba\(241, 239, 232, 0\.28\)/);
  const initial=await row.evaluate(el=>{const r=el.getBoundingClientRect(),p=[...el.querySelectorAll('.os-explore-panel')].map(p=>p.getBoundingClientRect().toJSON());return {row:r.toJSON(),panels:p,scroll:el.scrollLeft};});
  assert.equal(initial.scroll,0);assert.ok(Math.abs(initial.panels[0].left-initial.row.left-24)<=1,JSON.stringify(initial));assert.ok(initial.panels[1].left<initial.row.right&&initial.panels[1].right>initial.row.right,'right neighbour peeks in');
  await expect(panels.first().locator('h3')).toHaveCSS('font-size','28px');await expect(panels.first().locator('p')).toHaveCSS('font-size','18px');
  assert.equal(await panels.first().evaluate(el=>getComputedStyle(el).minHeight),width<430?'344px':'420px');
  const anchors=await panels.first().evaluate(el=>{const r=el.getBoundingClientRect(),t=el.querySelector('figure').getBoundingClientRect();return {left:t.left-r.left,top:t.top-r.top};});assert.ok(Math.abs(anchors.left-25)<=1);assert.ok(Math.abs(anchors.top-25)<=1);
  await row.focus();await row.press('ArrowRight');await expect(panels.nth(1)).toHaveClass(/is-selected/);
  const middle=await row.evaluate(el=>{const r=el.getBoundingClientRect(),p=[...el.querySelectorAll('.os-explore-panel')].map(p=>p.getBoundingClientRect().toJSON());return {row:r.toJSON(),panels:p};});
  assert.ok(middle.panels[0].right>middle.row.left&&middle.panels[0].right<middle.panels[1].left,'left neighbour remains visible');assert.ok(middle.panels[2].left<middle.row.right,'right neighbour remains visible');assert.ok(middle.panels[1].width>middle.panels[0].width,'selected panel is closer');
  await expectSharedPanelShadows(page);
  await row.evaluate(el=>el.blur());await page.screenshot({path:`outputs/explore-middle-${width}.png`});await row.focus();
  await expect(panels.nth(1).locator('figure,p')).toHaveCount(0);
  await row.press('End');await expect(panels.last()).toHaveClass(/is-selected/);const end=await row.evaluate(el=>el.scrollLeft);await row.press('ArrowRight');assert.equal(await row.evaluate(el=>el.scrollLeft),end);
  await row.press('Home');await expect(panels.first()).toHaveClass(/is-selected/);await row.press('ArrowLeft');assert.equal(await row.evaluate(el=>el.scrollLeft),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(await page.evaluate(()=>window.exploreState.habits.definitions),{});
  await row.evaluate(el=>el.blur());await page.screenshot({path:`outputs/explore-${width}.png`,fullPage:true});
  await page.getByRole('link',{name:'Today',exact:true}).click();await expect(page.locator('.os-today')).toBeVisible();await expect(page.locator('.os-app-shell')).toHaveCSS('background-color','rgb(25, 24, 19)');
}));

test('Explore keeps two blank panels per empty category and retries a failed load',{timeout:90000},()=>isolated(390,async(page,{respond})=>{
  await expect(page.locator('.os-explore-panel')).toHaveCount(6);await expect(page.locator('.os-explore-panel :is(h3,p,figure,a)')).toHaveCount(0);
  await expectSharedPanelShadows(page);
  await page.screenshot({path:'outputs/explore-empty-390.png',fullPage:true});
  respond({status:503,rows:{error:'Synthetic connection failure'}});await page.reload();await expect(page.getByRole('alert')).toContainText('Could not open Explore');await expect(page.locator('.os-explore-panel')).toHaveCount(6);
  respond({status:200,rows:catalog});await page.getByRole('button',{name:'Try again',exact:true}).click();await expect(page.getByRole('link',{name:'Open Synthetic habit',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Open Synthetic habit',exact:true}).click();await expect(page).toHaveURL(/\/os\/catalog\/read\?id=habit&version=1$/);
},{rows:[]}));

test('Explore supports native touch swipes, account changes and accessibility preferences',{timeout:90000},()=>isolated(390,async(page,{context,respond})=>{
  const row=page.getByRole('region',{name:'Chapters',exact:true}),panels=row.locator('.os-explore-panel'),bounds=await row.boundingBox();
  const session=await context.newCDPSession(page),y=bounds.y+100;
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:bounds.x+bounds.width-35,y}]});
  for(let i=1;i<=8;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:bounds.x+bounds.width-35-i*30,y}],timestamp:Date.now()/1000+i*.03});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>row.evaluate(el=>el.scrollLeft)).toBeGreaterThan(100);await expect(panels.first()).not.toHaveClass(/is-selected/);
  await session.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'},{name:'prefers-reduced-transparency',value:'reduce'}]});assert.ok(Number.parseFloat(await panels.first().evaluate(el=>getComputedStyle(el).transitionDuration))<=0.001);await expect(panels.first()).toHaveCSS('backdrop-filter','none');await session.detach();
  await page.emulateMedia({forcedColors:'active'});await expect(panels.first()).toHaveCSS('box-shadow','none');await expect(row.locator('.is-selected')).toHaveCSS('box-shadow','none');
  respond({status:200,rows:[]});await page.evaluate(()=>window.switchExploreAccount('synthetic-other'));await expect(page.locator('.os-explore-open')).toHaveCount(0);await expect(page.locator('.os-explore-panel')).toHaveCount(6);
}));

test('Explore depth moves calmly and late catalog responses cannot cross accounts',{timeout:90000},()=>isolated(390,async page=>{
  const row=page.getByRole('region',{name:'Chapters',exact:true});
  await row.focus();await row.evaluate(el=>{window.depthFrames=[];window.depthDone=false;const panel=el.querySelectorAll('.os-explore-panel')[1],start=performance.now();const sample=()=>{window.depthFrames.push(panel.getBoundingClientRect().width);if(performance.now()-start<1000)requestAnimationFrame(sample);else window.depthDone=true;};sample();});
  await row.press('ArrowRight');await page.waitForFunction(()=>window.depthDone);
  const widths=await page.evaluate(()=>window.depthFrames);assert.ok(widths.at(-1)>widths[0]+5);assert.ok(widths.some(width=>width>widths[0]+1&&width<widths.at(-1)-1),'depth has observed intermediate frames');
  let release;const gate=new Promise(resolve=>{release=resolve;});let reads=0;
  await page.route('**/os/catalog?view=explore',async route=>{reads++;if(reads===1){await gate;await route.fulfill({json:[{id:'late',kind:'chapter',version:1,title:'Previous account response'}]}).catch(()=>{});}else await route.fulfill({json:[]});});
  await page.evaluate(()=>window.switchExploreAccount('synthetic-pending'));await expect.poll(()=>reads).toBe(1);
  await page.evaluate(()=>window.switchExploreAccount('synthetic-latest'));await expect.poll(()=>reads).toBe(2);await expect(page.locator('.os-explore-panel')).toHaveCount(6);release();
  await expect(page.getByText('Previous account response',{exact:true})).toHaveCount(0);await expect(page.locator('.os-explore-open')).toHaveCount(0);
},{reducedMotion:'no-preference'}));
