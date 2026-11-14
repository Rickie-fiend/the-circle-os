import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createTemplateDraft} from '../app/os/admin/template-model.js';
const compile=(path,replacements=[])=>{let source=readFileSync(new URL(path,import.meta.url),'utf8');for(const[a,b]of replacements)source=source.replace(a,b);return `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`;};
const server=compile('../app/os/admin/account-admin-server.ts');
const route=await import(compile('../app/os/admin/publications/route.ts',[
 ['../account-admin-server',server],['../chapter-authoring.js',new URL('../app/os/admin/chapter-authoring.js',import.meta.url).href],['../../chapters/registry',`data:text/javascript,export const publishedChapters=[];`],['../template-model.js',new URL('../app/os/admin/template-model.js',import.meta.url).href],
]));
const original=globalThis.fetch,env={url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
after(()=>{globalThis.fetch=original;for(const[key,value]of [['NEXT_PUBLIC_SUPABASE_URL',env.url],['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',env.key]])if(value===undefined)delete process.env[key];else process.env[key]=value;});
test('template publication routes require current Admin and reject invalid rules before RPC',async()=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://synthetic.test';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='public';let allowed=true,writes=0;
 globalThis.fetch=async(url,init)=>{assert.equal(init.headers.Authorization,'Bearer fixture');if(String(url).endsWith('/user'))return Response.json({id:'admin',email_confirmed_at:'2026-11-13'});if(String(url).endsWith('/circle_content_admin'))return Response.json(allowed);writes++;return Response.json({version:1});};
 const draft=createTemplateDraft();draft.template.title='Synthetic';draft.template.items[0].action='Read';
 const request=(d=draft,authorized=true)=>new Request('https://app.test/os/admin/publications',{method:'POST',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer fixture'}:{})},body:JSON.stringify({action:'publish',draft:d})});
 assert.equal((await route.POST(request(draft,false))).status,401);assert.equal(writes,0);
 const invalid=structuredClone(draft);invalid.template.items[0].cue.source='eval';assert.equal((await route.POST(request(invalid))).status,400);assert.equal(writes,0);
 assert.equal((await route.POST(request())).status,200);assert.equal(writes,1);
 allowed=false;assert.equal((await route.POST(request())).status,403);assert.equal(writes,1);
});
