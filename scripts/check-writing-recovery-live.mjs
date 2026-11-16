import assert from 'node:assert/strict';
import { cp, mkdtemp, symlink, rm, mkdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as pause } from 'node:timers/promises';

if (!process.argv.includes('--write')) throw Error('Hosted synthetic-account verification requires approved --write.');
for (const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) assert.ok(process.env[key], 'Missing '+key);
const root=resolve('outputs'); await mkdir(root,{recursive:true});
const build=await mkdtemp(resolve(root,'writing-recovery-build-'));
const env=Object.fromEntries(['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PLAYWRIGHT_BROWSERS_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CIRCLE_AUTH_MODE:'supabase',NEXT_PUBLIC_CIRCLE_WRITING_SYNC:'enabled',NEXT_PUBLIC_SUPABASE_URL:process.env.NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY});
function run(args,cwd,extra={}) {return new Promise((done,reject)=>{const child=spawn(process.execPath,args,{cwd,env:{...env,...extra},stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?done():reject(Error('Check exited '+code)));});}
let app;
try {
  for(const path of ['app','public','package.json','package-lock.json','next.config.ts','postcss.config.mjs','tsconfig.json','tsconfig.vercel.json'])await cp(resolve(path),resolve(build,path),{recursive:true});
  await symlink(resolve('node_modules'),resolve(build,'node_modules'),'junction');
  await run([resolve('node_modules/next/dist/bin/next'),'build','--webpack'],build);
  const port=await new Promise(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>done(p));});});
  const origin='http://127.0.0.1:'+port;
  app=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:build,env,stdio:'inherit',windowsHide:true});
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(origin+'/os',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await pause(500);}
  assert.ok(ready,'production server starts');
  await run(['--test','tests/writing-recovery-live.browser.mjs'],process.cwd(),{CIRCLE_AUTH_LIVE_ORIGIN:origin,CIRCLE_AUTH_LIVE_WRITE:'approved',SUPABASE_SECRET_KEY:process.env.SUPABASE_SECRET_KEY});
} finally {
  if(app&&app.exitCode===null){const closed=new Promise(done=>app.once('exit',done));app.kill();await closed;}
  assert.ok(resolve(build).startsWith(root+sep));
  await rm(resolve(build,'node_modules'),{recursive:true,force:true});
  await rm(build,{recursive:true,force:true});
}
