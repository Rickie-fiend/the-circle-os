import assert from 'node:assert/strict';
import {cp,mkdtemp,symlink,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {setTimeout as pause} from 'node:timers/promises';

// No .env files or hosted credentials enter the disposable production build.
const root=resolve('outputs'), build=await mkdtemp(resolve(root,'writing-offline-build-'));
const env=Object.fromEntries(['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PLAYWRIGHT_BROWSERS_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CIRCLE_WRITING_SYNC:'disabled',NEXT_PUBLIC_CIRCLE_AUTH_MODE:'supabase',NEXT_PUBLIC_SUPABASE_URL:'https://circle-auth.test',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable-key'});
let app;
function run(args,cwd,extra={}) {return new Promise((done,reject)=>{const child=spawn(process.execPath,args,{cwd,env:{...env,...extra},stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',code=>code===0?done():reject(Error('Check command failed: '+code)));});}
try {
  for(const path of ['app','public','package.json','package-lock.json','next.config.ts','postcss.config.mjs','tsconfig.json','tsconfig.vercel.json'])await cp(resolve(path),resolve(build,path),{recursive:true});
  await symlink(resolve('node_modules'),resolve(build,'node_modules'),'junction');
  await run([resolve('node_modules/next/dist/bin/next'),'build','--webpack'],build);
  const port=await new Promise(done=>{const s=createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>done(p));});});
  const origin='http://127.0.0.1:'+port;
  app=spawn(process.execPath,[resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:build,env,stdio:'inherit',windowsHide:true});
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(origin+'/os',{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await pause(500);}
  assert.ok(ready,'isolated production server starts');
  // Select authentication/recovery behavior. The separate menu typography
  // cases still expect the retired 650 weight and remain unchanged.
  const selection='real client:|edited alias|forged marker|invite link|wrong password|successful password|cross-tab logout|missing or invalid|production';
  console.log('Running authentication/recovery checks; account-menu typography cases remain separate.');
  await run(['--test','--test-reporter=tap','--test-name-pattern='+selection,resolve('tests/supabase-auth.browser.mjs')],process.cwd(),{CIRCLE_AUTH_PRODUCTION_ORIGIN:origin});
} finally {
  if(app&&app.exitCode===null){const closed=new Promise(done=>app.once('exit',done));app.kill();await closed;}
  assert.ok(resolve(build).startsWith(root+sep));
  await rm(resolve(build,'node_modules'),{force:true,recursive:true});
  await rm(build,{force:true,recursive:true});
}
