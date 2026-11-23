import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as pause } from 'node:timers/promises';
import { createChapterDraft } from '../app/os/admin/chapter-authoring.js';

// Explicit write mode creates only synthetic accounts/content, then removes
// those exact fixtures. Never print tokens, passwords, user records or URLs.
if (!process.argv.includes('--write')) throw new Error('Use --write only after hosted verification approval.');
const chapterBrowser = process.argv.includes('--chapter-browser');
const useBrowser = chapterBrowser || process.argv.includes('--templates');
if (chapterBrowser && (!process.argv.includes('--app') || !process.argv.includes('--catalog') || process.argv.includes('--templates'))) {
  throw new Error('Chapter browser acceptance requires --app --catalog and runs separately from template checks.');
}
if(process.argv.includes('--templates')&&(!process.argv.includes('--catalog')||!process.argv.includes('--app')))throw new Error('Template acceptance requires --app --catalog as well as the approved --write flag.');
const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!origin || !publicKey || !secret) throw new Error('Missing hosted configuration.');
const tag = `admin-check-${randomUUID()}`;
const draftId = tag;
const fixtureIds = [draftId];
const syntheticDraft = createChapterDraft();
syntheticDraft.draftId = draftId;
syntheticDraft.chapter.id = tag;
const operationId = randomUUID();
const operationIds = [operationId];
const assetId = randomUUID();
const created = [];
let granted;
let uploaded = false;
let checks = 0;
let app;
let appOrigin;
if(process.argv.includes('--app')) {
  const port=await new Promise(resolve=>{const probe=createServer();probe.listen(0,'127.0.0.1',()=>{const port=probe.address().port;probe.close(()=>resolve(port));});});
  appOrigin=`http://127.0.0.1:${port}`;
  app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:process.env,stdio:'ignore',windowsHide:true});
}
async function call(path, {method='GET', body, token, admin=false, headers={}}={}) {
  const key = admin ? secret : publicKey;
  return fetch(`${origin}${path}`, {method, headers:{apikey:key, ...(token || admin ? {Authorization:`Bearer ${token || key}`} : {}), ...(body !== undefined ? {'Content-Type':'application/json'} : {}), ...headers}, ...(body !== undefined ? {body:JSON.stringify(body)} : {}), signal:AbortSignal.timeout(20000)});
}
async function ok(response, label) {
  assert.ok(response.ok, `${label}: HTTP ${response.status}`);
  checks++; console.log(`PASS ${label}`);
  return response;
}
async function rows(path, options) { return (await ok(await call(path, options), 'hosted read/write')).json(); }
async function rpc(token, revision=0, id=operationId, title='Synthetic draft') {
  return call('/rest/v1/rpc/circle_save_content_draft',{method:'POST',token,body:{draft:{...syntheticDraft,chapter:{...syntheticDraft.chapter,title}},expected_revision:revision,operation_id:id}});
}
try {
  if(app) {
    let ready=false;const deadline=Date.now()+45000;
    while(Date.now()<deadline) {if(app.exitCode!==null)throw new Error('Isolated app exited before readiness');try{const response=await fetch(`${appOrigin}/os/admin/status`,{signal:AbortSignal.timeout(1500)});if([401,403].includes(response.status)){ready=true;break;}}catch{}await pause(200);}
    assert.ok(ready,'Isolated production app did not become ready');
  }
  const bucket = await (await ok(await call('/storage/v1/bucket/circle-content',{admin:true}), 'private bucket exists')).json();
  assert.equal(bucket.public,false);
  assert.equal(Number(bucket.file_size_limit),5242880);
  for(let index=0;index<2;index++) {
    const email = `${tag}-${index}@example.com`, password=randomBytes(32).toString('hex');
    const user=await (await ok(await call('/auth/v1/admin/users',{method:'POST',admin:true,body:{email,password,email_confirm:true,...(useBrowser?{user_metadata:{alias:'Synthetic catalog reader'}}:{})}}),'create isolated account')).json();
    created.push(user.id);
    const login=await (await ok(await call('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}}),'synthetic sign in')).json();
    created[index]={id:user.id,token:login.access_token,...(useBrowser?{session:login}:{})};
  }
  const [a,b]=created;
  await ok(await call('/rest/v1/circle_content_admins',{method:'POST',admin:true,body:{account_id:a.id}}),'grant synthetic admin'); granted=a.id;
  assert.equal(await (await ok(await call('/rest/v1/rpc/circle_content_admin',{method:'POST',token:a.token,body:{}}),'admin role check')).json(),true);
  assert.equal(await (await ok(await call('/rest/v1/rpc/circle_content_admin',{method:'POST',token:b.token,body:{}}),'ordinary role check')).json(),false);
  if (chapterBrowser) {
    const { verifyHostedChapter } = await import('../tests/catalog-chapter-live.browser.mjs');
    const operation = () => { const id = randomUUID(); operationIds.push(id); return id; };
    await verifyHostedChapter({ a, b, appOrigin, origin, syntheticDraft, call, ok, operation });
  } else await verifyContentAdmin(a, b);
  await ok(await call(`/rest/v1/circle_content_admins?account_id=eq.${a.id}`,{method:'DELETE',admin:true}),'revoke synthetic grant');granted=null;
  assert.ok(!(await rpc(a.token,1,randomUUID())).ok);checks++;console.log('PASS revoked admin mutation denied');
  console.log(`Hosted checks passed: ${checks}`);
} finally {
  await cleanupFixtures();
}

async function verifyContentAdmin(a, b) {
  const accepted=await (await ok(await rpc(a.token),'save shared draft')).json();assert.equal(accepted.revision,1);
  assert.deepEqual(await (await ok(await rpc(a.token),'exact lost-response replay')).json(),accepted);
  assert.ok(!(await rpc(a.token,0,randomUUID(),'Competing')).ok); checks++;console.log('PASS competing edit denied');
  assert.ok(!(await rpc(b.token)).ok); checks++;console.log('PASS ordinary mutation denied');
  assert.ok(!(await rpc(undefined)).ok); checks++;console.log('PASS anonymous mutation denied');
  const path=`/rest/v1/circle_content_drafts?id=eq.${draftId}&select=*`;
  const visible=await rows(path,{token:a.token});assert.equal(visible[0].draft.chapter.title,'Synthetic draft');
  assert.deepEqual(await rows(path,{token:b.token}),[]);
  assert.ok(!(await call(path)).ok);checks++;console.log('PASS anonymous draft reading denied');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV6kAAAAASUVORK5CYII=','base64');
  async function upload(token) {return fetch(`${origin}/storage/v1/object/circle-content/${assetId}`,{method:'POST',headers:{apikey:publicKey,Authorization:`Bearer ${token}`,'Content-Type':'image/png','x-upsert':'false'},body:png,signal:AbortSignal.timeout(20000)});}
  assert.ok(!(await upload(b.token)).ok);checks++;console.log('PASS ordinary upload denied');
  await ok(await upload(a.token),'admin image upload');uploaded=true;
  assert.ok(!(await upload(a.token)).ok);checks++;console.log('PASS immutable image replacement denied');
  await ok(await call('/rest/v1/circle_content_assets',{method:'POST',token:a.token,body:{id:assetId,alt:'Synthetic test pixel',mime:'image/png',bytes:png.length}}),'save asset reference');
  await ok(await call(`/storage/v1/object/authenticated/circle-content/${assetId}`,{token:a.token}),'admin private image read');
  assert.ok(!(await call(`/storage/v1/object/authenticated/circle-content/${assetId}`,{token:b.token})).ok);checks++;console.log('PASS ordinary private image read denied');
  assert.ok(!(await call(`/storage/v1/object/public/circle-content/${assetId}`)).ok);checks++;console.log('PASS public image read denied');
  const signed=await (await ok(await call(`/storage/v1/object/sign/circle-content/${assetId}`,{method:'POST',token:a.token,body:{expiresIn:60}}),'sign private preview')).json();
  const preview=await fetch(`${origin}/storage/v1${signed.signedURL}`,{signal:AbortSignal.timeout(12000)});await ok(preview,'signed preview loads');assert.deepEqual(Buffer.from(await preview.arrayBuffer()),png);
  if(app) {
    async function http(path,token,options={}) {return fetch(`${appOrigin}/os/admin/${path}`,{...options,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...options.headers},signal:AbortSignal.timeout(30000)});}
    await ok(await http('status',a.token),'production HTTP admin allow');
    assert.equal((await http('status',b.token)).status,403);checks++;console.log('PASS production HTTP ordinary denial');
    assert.equal((await http('status',null,{headers:{Cookie:'circle_os_admin=forged'}})).status,401);checks++;console.log('PASS production HTTP cookie bypass denied');
    await ok(await http('catalog',a.token),'production HTTP draft reload');
    const httpOperation=randomUUID();operationIds.push(httpOperation);
    const payload=JSON.stringify({draft:{...syntheticDraft,chapter:{...syntheticDraft.chapter,title:'Synthetic HTTP draft'}},revision:1,operationId:httpOperation});
    const save=()=>http('catalog',a.token,{method:'POST',headers:{'Content-Type':'application/json'},body:payload});
    assert.equal((await (await ok(await save(),'production HTTP draft save')).json()).revision,2);
    assert.equal((await (await ok(await save(),'production HTTP exact retry')).json()).revision,2);
    const images=await (await ok(await http('media',a.token),'production HTTP media library')).json();
    const image=images.find(value=>value.id===assetId);assert.ok(image?.preview);
    await ok(await fetch(image.preview,{signal:AbortSignal.timeout(12000)}),'production HTTP private preview');
    function form(bytes=png) {const body=new FormData();body.set('id',assetId);body.set('alt','Synthetic test pixel');body.set('image',new File([bytes],'synthetic.png',{type:'image/png'}));return body;}
    await ok(await http('media',a.token,{method:'POST',body:form()}),'production HTTP immutable upload retry');
    const changed=Buffer.from(png);changed[changed.length-1]^=1;
    assert.equal((await http('media',a.token,{method:'POST',body:form(changed)})).status,503);checks++;console.log('PASS production HTTP changed image denied (current service-error classification)');
    const retained=await ok(await call(`/storage/v1/object/authenticated/circle-content/${assetId}`,{token:a.token}),'original immutable image retained');assert.deepEqual(Buffer.from(await retained.arrayBuffer()),png);
    assert.ok(!(await http('media',b.token,{method:'POST',body:form()})).ok);checks++;console.log('PASS production HTTP ordinary upload denied');
  }
  if(process.argv.includes('--catalog')) {
    const operation=()=>{const id=randomUUID();operationIds.push(id);return id;};
    const change=(command,token=a.token)=>call('/rest/v1/rpc/circle_catalog_change',{method:'POST',token,body:{command}});
    const read=(id,version,token=b.token)=>call('/rest/v1/rpc/circle_catalog_read',{method:'POST',token,body:{item:id,edition:version}});
    const http=(path,token=b.token,options={})=>fetch(`${appOrigin}/os/${path}`,{...options,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...options.headers},signal:AbortSignal.timeout(30000)});
    let [saved]=await rows(`/rest/v1/circle_content_drafts?id=eq.${draftId}&select=*`,{token:a.token});
    saved.draft.chapter.pages[0].image={assetId,alt:'Synthetic published pixel',caption:'Original caption'};
    await ok(await call('/rest/v1/rpc/circle_save_content_draft',{method:'POST',token:a.token,body:{draft:saved.draft,expected_revision:saved.revision,operation_id:operation()}}),'save chapter image placement');
    saved.revision++;
    const command={action:'publish',id:tag,draftId,draftRevision:saved.revision,draft:saved.draft,expectedRevision:0,operationId:operation()};
    assert.ok(!(await change(command,b.token)).ok);checks++;console.log('PASS ordinary publication denied');
    assert.ok(!(await change(command,null)).ok);checks++;console.log('PASS anonymous publication denied');
    const accepted=await(await ok(await change(command),'publish chapter v1')).json();assert.equal(accepted.version,1);
    assert.deepEqual(await(await ok(await change(command),'replay catalog receipt')).json(),accepted);
    assert.ok(!(await change({...command,operationId:operation()})).ok);checks++;console.log('PASS stale catalog publication denied');
    const original=await(await ok(await read(tag,1),'ordinary exact chapter read')).json();
    const newer=structuredClone(saved.draft);newer.chapter.title='Synthetic next edition';
    await ok(await call('/rest/v1/rpc/circle_save_content_draft',{method:'POST',token:a.token,body:{draft:newer,expected_revision:saved.revision,operation_id:operation()}}),'save next chapter draft');
    const second={...command,draft:newer,draftRevision:saved.revision+1,expectedRevision:1,operationId:operation()};
    if(app) await ok(await http('admin/publications',a.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(second)}),'production HTTP publish chapter v2');
    else await ok(await change(second),'publish chapter v2');
    assert.equal((await(await ok(await read(tag,2),'read chapter v2')).json()).content.chapter.title,newer.chapter.title);
    assert.deepEqual(await(await ok(await read(tag,1),'chapter v1 preserved')).json(),original);
    const articleId=`${tag}-article`;fixtureIds.push(articleId);
    const article={...structuredClone(syntheticDraft),draftId:articleId,article:{title:'Synthetic article',summary:'Test summary',cover:{assetId,alt:'Synthetic article pixel'},blocks:[{id:'body',type:'paragraph',text:'Synthetic article body'}]}};
    await ok(await call('/rest/v1/rpc/circle_save_content_draft',{method:'POST',token:a.token,body:{draft:article,expected_revision:0,operation_id:operation()}}),'save article draft');
    const publishArticle={action:'publish',id:articleId,draftId:articleId,draftRevision:1,draft:article,expectedRevision:0,operationId:operation()};
    if(app) {
      await ok(await http('admin/publications',a.token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(publishArticle)}),'production HTTP publish article');
      const edition=await(await ok(await http(`catalog?id=${articleId}&version=1`),'production HTTP signed-in Article reader')).json();assert.deepEqual(edition.content.article,article.article);
      assert.equal((await http(`catalog?id=${articleId}&version=1`,null)).status,403);checks++;console.log('PASS production HTTP signed-out reader denied');
      const image=await(await ok(await http(`catalog/media?id=${assetId}`),'production HTTP reader image signing')).json();
      assert.deepEqual(Buffer.from(await(await ok(await fetch(image.preview),'published image loads')).arrayBuffer()),png);
      assert.equal((await http(`catalog/media?id=${assetId}`,null)).status,403);checks++;console.log('PASS production HTTP signed-out image signing denied');
    } else await ok(await change(publishArticle),'publish article');
    await ok(await change({action:'withdraw',id:tag,expectedRevision:2,operationId:operation()}),'withdraw chapter');
    assert.deepEqual(await(await ok(await read(tag,1),'withdrawn chapter retains v1')).json(),original);
    const listing=()=>call('/rest/v1/rpc/circle_catalog_read',{method:'POST',token:b.token,body:{}});
    assert.ok(!(await(await ok(await listing(),'withdrawn discovery check')).json()).some(item=>item.id===tag));
    await ok(await change({action:'restore',id:tag,expectedRevision:3,operationId:operation()}),'restore chapter');
    assert.ok((await(await ok(await listing(),'restored discovery check')).json()).some(item=>item.id===tag));
    if(process.argv.includes('--templates')) {
      const{verifyLiveTemplates}=await import('./check-content-templates-live.mjs');
      await verifyLiveTemplates({tag,a,b,assetId,fixtureIds,operation,call,ok,change,read,http,origin,appOrigin});
    }
  }
}

async function cleanupFixtures() {
  const cleanupErrors=[];
  async function cleanup(work) {try {await work();} catch(error) {cleanupErrors.push(error.message);}}
  if(process.argv.includes('--catalog')) for(const table of ['circle_content_version_assets','circle_content_items','circle_content_versions']) for(const id of fixtureIds) await cleanup(async()=>ok(await call(`/rest/v1/${table}?id=eq.${id}`,{method:'DELETE',admin:true}),'remove exact synthetic catalog fixture'));
  if (uploaded) await cleanup(async()=>ok(await call('/storage/v1/object/circle-content',{method:'DELETE',admin:true,body:{prefixes:[assetId]}}),'remove exact synthetic image'));
  await cleanup(async()=>ok(await call(`/rest/v1/circle_content_assets?id=eq.${assetId}`,{method:'DELETE',admin:true}),'remove exact synthetic asset metadata'));
  for(const id of operationIds) await cleanup(async()=>ok(await call(`/rest/v1/circle_content_receipts?operation_id=eq.${id}`,{method:'DELETE',admin:true}),'remove exact synthetic receipt'));
  for(const id of fixtureIds) await cleanup(async()=>ok(await call(`/rest/v1/circle_content_drafts?id=eq.${id}`,{method:'DELETE',admin:true}),'remove exact synthetic draft'));
  if(granted) await cleanup(async()=>ok(await call(`/rest/v1/circle_content_admins?account_id=eq.${granted}`,{method:'DELETE',admin:true}),'remove synthetic grant'));
  for(const account of created) {const id=typeof account==='string'?account:account.id;await cleanup(async()=>ok(await call(`/auth/v1/admin/users/${id}`,{method:'DELETE',admin:true}),'remove isolated account'));}
  if(app) {app.kill();await Promise.race([new Promise(resolve=>app.once('exit',resolve)),pause(3000)]);}
  if(cleanupErrors.length) throw new Error(`Cleanup needs attention: ${cleanupErrors.join('; ')}`);
  for(const id of fixtureIds) {
    assert.deepEqual(await rows(`/rest/v1/circle_content_drafts?id=eq.${id}&select=id`,{admin:true}),[]);
    if(process.argv.includes('--catalog')) for(const table of ['circle_content_version_assets','circle_content_items','circle_content_versions']) assert.deepEqual(await rows(`/rest/v1/${table}?id=eq.${id}&select=id`,{admin:true}),[]);
  }
  assert.deepEqual(await rows(`/rest/v1/circle_content_drafts?id=eq.${draftId}&select=id`,{admin:true}),[]);
  assert.deepEqual(await rows(`/rest/v1/circle_content_assets?id=eq.${assetId}&select=id`,{admin:true}),[]);
  for(const id of operationIds) assert.deepEqual(await rows(`/rest/v1/circle_content_receipts?operation_id=eq.${id}&select=operation_id`,{admin:true}),[]);
  for(const account of created) {const id=typeof account==='string'?account:account.id;assert.ok(!(await call(`/auth/v1/admin/users/${id}`,{admin:true})).ok);}
  if(uploaded) assert.ok(!(await call(`/storage/v1/object/authenticated/circle-content/${assetId}`,{admin:true})).ok);
  console.log('Synthetic cleanup confirmed.');
}
