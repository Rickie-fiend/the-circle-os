import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const compile = (path,replacements=[]) => {
 let source=readFileSync(new URL(path,import.meta.url),'utf8');
 for(const [a,b] of replacements) source=source.replace(a,b);
 return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;
};
const serverUrl=compile('../app/os/admin/account-admin-server.ts');
const { accountAdmin }=await import(serverUrl);
const catalog=await import(compile('../app/os/admin/catalog/route.ts', [['../account-admin-server',serverUrl]]));
const media=await import(compile('../app/os/admin/media/route.ts', [['../account-admin-server',serverUrl]]));
const original=globalThis.fetch;
const env={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
after(()=>{globalThis.fetch=original;for(const [key,value]of [['NEXT_PUBLIC_SUPABASE_URL',env.url],['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',env.key]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
test('account gate ignores an old Admin cookie and rejects forged or unconfirmed sessions',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://synthetic.test';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='synthetic-public';
 let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({}, {status:401});};
 await assert.rejects(accountAdmin(new Request('https://circle.test',{headers:{Cookie:'circle_os_admin=old'}})),/Sign in/);assert.equal(calls,0);
 await assert.rejects(accountAdmin(new Request('https://circle.test',{headers:{Authorization:'Bearer forged'}})),/Sign in/);
 globalThis.fetch=async()=>Response.json({id:'synthetic'});
 await assert.rejects(accountAdmin(new Request('https://circle.test',{headers:{Authorization:'Bearer unconfirmed'}})),/Sign in/);
});
test('each protected request checks the live role and returns only allowed draft data',async()=>{
 let allowed=true;const calls=[];
 globalThis.fetch=async(input,init)=>{calls.push(String(input));assert.equal(init.headers.Authorization,'Bearer synthetic');if(String(input).endsWith('/user'))return Response.json({id:'synthetic',email_confirmed_at:'2026-11-11'});if(String(input).includes('/rpc/'))return Response.json(allowed);return Response.json([{id:'draft',draft:{draftId:'draft'}}]);};
 const request=()=>new Request('https://circle.test/os/admin/catalog',{headers:{Authorization:'Bearer synthetic'}});
 assert.equal((await catalog.GET(request())).status,200);allowed=false;assert.equal((await catalog.GET(request())).status,403);assert.equal(calls.filter(url=>url.includes('circle_content_drafts')).length,1);
});
test('network and service failures remain distinct from a revoked Admin grant',async()=>{
 globalThis.fetch=async()=>{throw new TypeError('Synthetic network failure');};
 const request=()=>new Request('https://circle.test/os/admin/catalog',{headers:{Authorization:'Bearer synthetic'}});
 assert.equal((await catalog.GET(request())).status,503);
 globalThis.fetch=async()=>Response.json({}, {status:503});assert.equal((await catalog.GET(request())).status,503);
 globalThis.fetch=async input=>String(input).endsWith('/user')?Response.json({id:'synthetic',email_confirmed_at:'2026-11-13'}):Response.json(false);
 assert.equal((await catalog.GET(request())).status,403);
});
test('image retries compare immutable bytes and invalid image types never upload',async()=>{
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10,0]);let uploads=0,metadata=0;
 globalThis.fetch=async(input)=>{
  const url=String(input);
  if(url.endsWith('/user'))return Response.json({id:'synthetic',email_confirmed_at:'2026-11-11'});
  if(url.includes('/rpc/'))return Response.json(true);
  if(url.includes('/object/authenticated/'))return new Response(bytes);
  if(url.includes('/object/circle-content/')){uploads++;return Response.json({error:'already exists'},{status:400});}
  metadata++;return new Response(null,{status:201});
 };
 const request=(mime)=>{const body=new FormData();body.set('id','11111111-1111-4111-8111-111111111111');body.set('alt','Synthetic image');body.set('image',new File([bytes],'test.png',{type:mime}));return new Request('https://circle.test/os/admin/media',{method:'POST',headers:{Authorization:'Bearer synthetic'},body});};
 assert.equal((await media.POST(request('image/svg+xml'))).status,400);assert.equal(uploads,0);
 assert.equal((await media.POST(request('image/png'))).status,200);assert.equal(metadata,1);
});
