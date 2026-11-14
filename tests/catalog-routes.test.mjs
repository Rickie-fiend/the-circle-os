import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const compile=(path,replacements=[])=>{let source=readFileSync(new URL(path,import.meta.url),'utf8');for(const[a,b]of replacements)source=source.replace(a,b);return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;};
const server=compile('../app/os/catalog/server.ts');
const reader=await import(compile('../app/os/catalog/route.ts',[['./server',server]]));
const media=await import(compile('../app/os/catalog/media/route.ts',[['../server',server]]));
const original=globalThis.fetch,env={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
after(()=>{globalThis.fetch=original;for(const[key,value]of [['NEXT_PUBLIC_SUPABASE_URL',env.url],['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',env.key]])if(value===undefined)delete process.env[key];else process.env[key]=value;});
test('reader rejects unsigned and unverified requests before content access',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://synthetic.test';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public';let calls=0;
 globalThis.fetch=async()=>{calls++;return Response.json({id:'test'});};
 assert.equal((await reader.GET(new Request('https://app.test/os/catalog'))).status,403);assert.equal(calls,0);
 assert.equal((await reader.GET(new Request('https://app.test/os/catalog',{headers:{Authorization:'Bearer test'}}))).status,403);assert.equal(calls,1);
});
test('exact reader and targeted image signing use caller token and avoid shared caches',async()=>{
 const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});assert.equal(init.headers.Authorization,'Bearer test');if(String(url).endsWith('/user'))return Response.json({id:'test',email_confirmed_at:'2026-11-11'});return Response.json(String(url).includes('/object/sign/')?{signedURL:'/signed-fixture'}:{version:1,content:{kind:'article'}});};
 const request=url=>new Request(url,{headers:{Authorization:'Bearer test'}});
 const response=await reader.GET(request('https://app.test/os/catalog?id=test&version=1'));
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.deepEqual(JSON.parse(calls[1].init.body),{item:'test',edition:1});
 const image=await media.GET(request('https://app.test/os/catalog/media?id=33333333-3333-4333-8333-333333333333'));assert.equal(image.status,200);assert.equal(JSON.parse(calls.at(-1).init.body).expiresIn,300);
 globalThis.fetch=async url=>String(url).endsWith('/user')?Response.json({id:'test',email_confirmed_at:'2026-11-11'}):Response.json({error:'denied'},{status:403});
 assert.equal((await media.GET(request('https://app.test/os/catalog/media?id=33333333-3333-4333-8333-333333333333'))).status,404);
});

test('Explore lists published summaries in one caller-scoped read and hides withdrawn items for every role',async()=>{
 const rows=[{id:'chapter',kind:'chapter',version:2,title:'Saved title',description:'Saved description',cover:{assetId:'cover',alt:'Saved alt'},revision:3,withdrawn:false},{id:'hidden',kind:'article',version:1,title:'Withdrawn',withdrawn:true},{id:'habit',kind:'routine-template',version:1,title:'Only a title',withdrawn:false}];
 const calls=[];globalThis.fetch=async(url,init)=>{calls.push({url:String(url),init});return String(url).endsWith('/user')?Response.json({id:'admin',email_confirmed_at:'2026-11-14'}):Response.json(rows);};
 const response=await reader.GET(new Request('https://app.test/os/catalog?view=explore',{headers:{Authorization:'Bearer test'}}));
 assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(calls.length,2);
 assert.deepEqual(JSON.parse(calls[1].init.body),{item:null,edition:null});
 assert.deepEqual(await response.json(),[{id:'chapter',kind:'chapter',version:2,title:'Saved title',description:'Saved description',cover:rows[0].cover},{id:'habit',kind:'routine-template',version:1,title:'Only a title'}]);
 globalThis.fetch=async url=>String(url).endsWith('/user')?Response.json({id:'test',email_confirmed_at:'2026-11-14'}):Response.json({unexpected:true});
 assert.equal((await reader.GET(new Request('https://app.test/os/catalog?view=explore',{headers:{Authorization:'Bearer test'}}))).status,503);
});
