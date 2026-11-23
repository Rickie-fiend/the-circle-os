import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {cp,mkdir,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {request as httpRequest} from 'node:http';
import {setTimeout as pause} from 'node:timers/promises';

// Only synthetic local stacks are accepted. Never load .env.local or linked projects.
assert.ok(process.argv.includes('--write'),'Use --write for approved disposable local resources.');
const cli=process.env.CIRCLE_SUPABASE_CLI||'D:/CircleOs-tools/supabase/supabase.exe';
const docker=process.env.CIRCLE_DOCKER_CLI||'docker';
const repo=resolve('.'),outputs=resolve('outputs');await mkdir(outputs,{recursive:true});
const root=await mkdtemp(resolve(outputs,'backup-restore-'));
const tag='circle-rehearsal-'+randomUUID().slice(0,8),network=tag;
const env=Object.fromEntries(['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PLAYWRIGHT_BROWSERS_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const stacks=[],images=[],children=new Set(),report={tag,startedAt:new Date().toISOString(),runs:[],cleanup:false};
const hash=b=>createHash('sha256').update(b).digest('hex');
function run(exe,args,{cwd=root,input,timeout=120000,combined=false}={}){
  return new Promise((yes,no)=>{
    const child=spawn(exe,args,{cwd,env,windowsHide:true,stdio:['pipe','pipe','pipe']});children.add(child);
    const out=[],err=[];let timed=false;
    const timer=setTimeout(()=>{timed=true;child.kill();},timeout);
    child.stdout.on('data',b=>out.push(b));child.stderr.on('data',b=>err.push(b));
    child.on('error',no);child.on('close',code=>{
      clearTimeout(timer);children.delete(child);const stdout=Buffer.concat(combined?[...out,...err]:out);
      if(code===0&&!timed)return yes(stdout);
      const stderr=Buffer.concat(err).toString();
      // COPY errors can include Auth row values. Report SQL error headings only.
      const diagnostic=args.includes('psql')?stderr.split('\n').filter(line=>/^(ERROR|FATAL):/.test(line)).map(line=>line.startsWith('ERROR:  invalid input')?'ERROR: invalid imported value (details withheld)':line).join('\n'):stderr.slice(-4000);
      const action=args[0]==='exec'?args.slice(0,4).join(' '):args[0];
      const error=Error('Command failed: '+exe.split(/[\\/]/).at(-1)+' '+action+' (exit '+code+', timeout '+timed+')\n'+diagnostic);
      Object.defineProperty(error,'stdout',{value:stdout});no(error);
    });
    child.stdin.on('error',()=>{});child.stdin.end(input);
  });
}
const d=(args,options)=>run(docker,args,options);
async function storageExec(stack,args,input){
  for(let attempt=0;;attempt++){
    try{return await d(['exec','-i',stack.storageName,...args],{input});}
    catch(error){
      if(attempt>=30||!/is restarting|is not running/.test(error.message))throw error;
      await pause(500);
    }
  }
}
const sql=(stack,text,admin=false)=>d(['exec','-i',stack.db,'psql','-X','-v','ON_ERROR_STOP=1','-U',admin?'supabase_admin':'postgres','-d','postgres','-At'],{input:text});
const scalar=async(stack,text)=>JSON.parse((await sql(stack,text)).toString().trim());
function engine(path,body){return new Promise((yes,no)=>{
  const req=httpRequest({socketPath:process.platform==='win32'?'\\\\.\\pipe\\dockerDesktopLinuxEngine':'/var/run/docker.sock',path,method:'POST',headers:{'Content-Type':'application/json'}},response=>{const chunks=[];response.on('data',b=>chunks.push(b));response.on('end',()=>{if(response.statusCode>=300)return no(Error('Local Docker API HTTP '+response.statusCode));yes(JSON.parse(Buffer.concat(chunks).toString()||'null'));});});req.on('error',no);req.end(JSON.stringify(body));
});}
async function localStack(role,base){
  const dir=resolve(root,role),id=tag+'-'+role;await mkdir(dir);
  const stack={dir,id,db:'supabase_db_'+id};stacks.push(stack);
  await run(cli,['init','--workdir',dir]);
  const path=resolve(dir,'supabase/config.toml');let config=await readFile(path,'utf8');
  config=config.replace(/^project_id = .*$/m,'project_id = '+JSON.stringify(id));
  config=config.replace(/^(\s*(?:port|shadow_port|inspector_port)\s*=\s*)(\d+)/gm,(_,a,b)=>a+(base+Number(b)%100));
  for(const section of ['studio','local_smtp','realtime','edge_runtime','analytics','storage.vector','db.seed']){
    const pattern=new RegExp('(\\['+section.replaceAll('.','\\.')+'\\][\\s\\S]*?)(?=\\n\\[|$)');
    config=config.replace(pattern,block=>block.replace(/^enabled = true$/m,'enabled = false'));
  }
  await writeFile(path,config);
  if(role==='source')await cp(resolve(repo,'supabase/migrations'),resolve(dir,'supabase/migrations'),{recursive:true});
  console.log('Starting synthetic '+role+' stack. First startup may download official images.');
  const startup=setInterval(()=>console.log('Local '+role+' stack startup is still running.'),45000);
  try{await run(cli,['start','--workdir',dir,'--network-id',network,'--exclude','realtime,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor,mailpit'],{timeout:1200000});}finally{clearInterval(startup);}
  const status=JSON.parse((await run(cli,['status','--workdir',dir,'--output','json'])).toString());
  stack.host=status.API_URL;stack.key=status.ANON_KEY;stack.secret=status.SERVICE_ROLE_KEY;
  assert.equal(new URL(stack.host).hostname,'127.0.0.1');assert.ok(stack.key&&stack.secret,'local status keys');
  const ids=(await d(['ps','-aq','--filter','label=com.supabase.cli.project='+id])).toString().trim().split(/\s+/).filter(Boolean);
  assert.ok(ids.length,'owned containers');
  for(let container of JSON.parse((await d(['inspect',...ids])).toString())){
    assert.equal(container.Config.Labels['com.supabase.cli.project'],id,'owned container only');
    const bindings=container.HostConfig.PortBindings||{};
    console.log('Local bindings',container.Name,Object.fromEntries(Object.entries(container.NetworkSettings.Ports||{}).map(([port,values])=>[port,(values||[]).map(v=>v.HostIp)])));
    if(Object.values(bindings).flat().some(binding=>!['127.0.0.1','::1'].includes(binding.HostIp))){
      // CLI v3 explicitly overrides the bridge default. Recreate only its own
      // published containers with explicit loopback bindings, before any fixtures.
      for(const values of Object.values(bindings))for(const binding of values)binding.HostIp='127.0.0.1';
      const name=container.Name.slice(1);
      await d(['stop',container.Id]);
      const snapshot=(await d(['commit','--change','LABEL circle.rehearsal='+tag,container.Id])).toString().trim();images.push(snapshot);
      await d(['rm',container.Id]);
      const endpoints=Object.fromEntries(Object.entries(container.NetworkSettings.Networks).map(([name,value])=>[name,{Aliases:value.Aliases}]));
      const created=await engine('/containers/create?name='+encodeURIComponent(name),{...container.Config,Image:snapshot,HostConfig:container.HostConfig,NetworkingConfig:{EndpointsConfig:endpoints}});
      await d(['start',created.Id]);
      container=JSON.parse((await d(['inspect',created.Id])).toString())[0];
    }
    for(const values of Object.values(container.HostConfig.PortBindings||{}))for(const binding of values)assert.ok(['127.0.0.1','::1'].includes(binding.HostIp),'non-loopback service binding');
  }
  // Rebinding the DB terminates pooled connections. Restart only this stack's
  // dependent services so the first fixture request cannot use a stale socket.
  let dbReady=false;for(let i=0;i<60;i++){try{await sql(stack,'select 1;');dbReady=true;break;}catch{}await pause(500);}assert.ok(dbReady,'rebound database ready');
  const dependents=(await d(['ps','-aq','--filter','label=com.supabase.cli.project='+id])).toString().trim().split(/\s+/).filter(Boolean);
  for(const item of JSON.parse((await d(['inspect',...dependents])).toString()))if(item.Name!=='/'+stack.db)await d(['restart',item.Id]);
  let healthy=false;for(let i=0;i<120;i++){try{if((await fetch(stack.host+'/auth/v1/health',{headers:{apikey:stack.key},signal:AbortSignal.timeout(1000)})).ok){healthy=true;break;}}catch{}await pause(500);}assert.ok(healthy,'local Auth gateway healthy after loopback binding');
  stack.storage=JSON.parse((await d(['inspect','supabase_storage_'+id])).toString())[0];
  stack.storageName=stack.storage.Name.slice(1);
  const storageVolumes=stack.storage.Mounts.filter(m=>m.Type==='volume'&&m.Name==='supabase_storage_'+id);
  assert.equal(storageVolumes.length,1,'exact owned storage volume');stack.storagePath=storageVolumes[0].Destination;
  stack.tenant=stack.storage.Config.Env.find(v=>v.startsWith('TENANT_ID='))?.slice('TENANT_ID='.length);
  return stack;
}
function requestLocal(stack,path,body,token,method='POST'){
  assert.equal(new URL(stack.host).hostname,'127.0.0.1');
  return fetch(stack.host+path,{method,headers:{apikey:stack.key,Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
}
async function api(stack,path,body,token=stack.secret,method='POST'){
  const response=await requestLocal(stack,path,body,token,method);
  if(!response.ok){
    const body=await response.json().catch(()=>({}));
    console.log('Local API failure',{path:path.split('?')[0],status:response.status,code:body.code||body.error_code,message:body.msg||body.message||body.error});
    if(path.startsWith('/auth/')&&response.status>=500){
      const logs=(await d(['logs','--tail','8','supabase_auth_'+stack.id],{combined:true})).toString();
      for(const line of logs.split('\n'))try{const item=JSON.parse(line);if(item.error)console.log('Local Auth diagnostic',String(item.error).replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted database URL]'));}catch{}
    }
  }
  assert.ok(response.ok,'local API '+path.split('?')[0]+' HTTP '+response.status);return response.status===204?null:response.json();
}
async function inventory(stack){return scalar(stack,"select coalesce(jsonb_agg(jsonb_build_object('table',t,'rows',r) order by t),'[]') from ("+['circle_private.writing_heads','circle_private.writing_receipts','circle_private.writing_conflicts','circle_private.writing_resolutions','public.circle_content_admins','public.circle_content_assets','public.circle_content_drafts','public.circle_content_receipts','public.circle_content_versions','public.circle_content_items','public.circle_content_version_assets','public.circle_quotes','auth.users','auth.identities','storage.buckets','storage.objects'].map(t=>`select '${t}' t,coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text),'[]') r from ${t} x`).join(' union all ')+') q;');}
async function restore(target,dump,{interrupt=false}={}){
  const started=performance.now();
  const before='begin; set local session_replication_role=replica;\n';
  if(interrupt){
    let interrupted=false;
    try{await sql(target,before+dump+"\nselect 'CIRCLE_RESTORE_PRECOMMIT';\nselect pg_terminate_backend(pg_backend_pid());\ncommit;",true);}catch(error){
      assert.match(error.stdout.toString(),/CIRCLE_RESTORE_PRECOMMIT/,'entire import reached pre-commit boundary');
      assert.match(error.message,/terminating connection/,'connection termination caused rollback');interrupted=true;
    }
    assert.ok(interrupted,'restore was actually interrupted');
    assert.equal(await scalar(target,"select count(*)::int from pg_tables where schemaname='circle_private';"),0,'failed restore rolls back schema and data');
    return;
  }
  await sql(target,before+dump+'\ncommit;',true);
  await sql(target,"notify pgrst,'reload schema';");
  return Math.round(performance.now()-started);
}
function verifiedArtifact(backup,manifest){assert.equal(hash(backup),manifest.sha256,'backup checksum');assert.ok(backup.length>0,'backup present');return backup.toString();}
async function requireRecoverySessions(target){
  // This guard belongs to the disposable recovery target. A signed token alone
  // does not prove its session survived reconciliation.
  await sql(target,`
    create schema circle_rehearsal;
    create function circle_rehearsal.require_active_session() returns void
    language plpgsql security definer set search_path = pg_catalog as $$
    declare claims jsonb := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
    begin
      if claims->>'role' = 'authenticated' and not exists (
        select from auth.sessions where id::text = claims->>'session_id' and user_id::text = claims->>'sub'
      ) then
        raise sqlstate 'PT401' using message = 'Recovery session is not active';
      end if;
    end;
    $$;
    revoke execute on function circle_rehearsal.require_active_session() from public;
    grant usage on schema circle_rehearsal to anon,authenticated,service_role;
    grant execute on function circle_rehearsal.require_active_session() to anon,authenticated,service_role;
    alter role authenticator set pgrst.db_pre_request = 'circle_rehearsal.require_active_session';
  `,true);
  await d(['restart','supabase_rest_'+target.id]);
}
async function freePort(){return new Promise((yes,no)=>{const s=createServer();s.on('error',no);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>yes(p));});});}
async function buildApp(target,reuseBuild){
  const appEnv={...env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_CIRCLE_AUTH_MODE:'supabase',NEXT_PUBLIC_CIRCLE_WRITING_SYNC:'enabled',NEXT_PUBLIC_SUPABASE_URL:target.host,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:target.key};
  const dir=resolve(root,'build');
  if(!reuseBuild){
    await mkdir(dir);
    for(const path of ['app','public','package.json','package-lock.json','next.config.ts','postcss.config.mjs','tsconfig.json','tsconfig.vercel.json'])await cp(resolve(repo,path),resolve(dir,path),{recursive:true});
    await mkdir(resolve(dir,'docs/design'),{recursive:true});
    const variants=JSON.parse(await readFile(resolve(repo,'app/os/home/imprint-art-variants.json'),'utf8'));
    const densityFiles=variants.flatMap(({bone,coordinates})=>[bone.file,coordinates.file]);
    for(const file of ['personal-imprint-color-v1.json','personal-imprint-growth-v1.json','personal-imprint-color-v1-sori-bone.png','personal-imprint-color-v1-sori-coordinates.bin',...densityFiles]){
      await cp(resolve(repo,'docs/design',file),resolve(dir,'docs/design',file));
    }
    const {symlink}=await import('node:fs/promises');await symlink(resolve(repo,'node_modules'),resolve(dir,'node_modules'),'junction');
    const original={...env};Object.assign(env,appEnv);
    try{await run(process.execPath,[resolve(repo,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:dir,timeout:300000});}finally{for(const k of Object.keys(env))delete env[k];Object.assign(env,original);}
  }
  const port=await freePort(),origin='http://127.0.0.1:'+port;
  const app=spawn(process.execPath,[resolve(repo,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:dir,env:appEnv,windowsHide:true,stdio:'ignore'});children.add(app);app.once('exit',()=>children.delete(app));
  for(let i=0;i<120;i++){try{if((await fetch(origin+'/os')).ok)return {origin,app};}catch{}await pause(500);}throw Error('isolated app startup');
}
let networkCreated=false;
try{
  await d(['info','--format','{{.ServerVersion}}']);
  await d(['network','create','--label','circle.rehearsal='+tag,'--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network]);networkCreated=true;
  const source=await localStack('source',55400);
  const {fixture,save,commit,memoryStore}=await import('../tests/helpers/writing-cloud.mjs');
  const {writingUploadRequests}=await import('../app/os/writing-cloud-model.js');
  const {syncAccountWriting}=await import('../app/os/writing-cloud-sync.js');
  const {prepareWritingChoice,queueWritingChoice}=await import('../app/os/writing-conflict-model.js');
  const accounts=[];for(let i=0;i<3;i++){
    const a={email:'synthetic-'+randomUUID()+'@example.com',password:randomUUID()+'Aa1!'};
    a.id=(await api(source,'/auth/v1/admin/users',{...a,email_confirm:true})).id;accounts.push(a);
  }
  const token=(await api(source,'/auth/v1/token?grant_type=password',{email:accounts[0].email,password:accounts[0].password},source.key)).access_token;
  const revoked=await api(source,'/auth/v1/token?grant_type=password',{email:accounts[1].email,password:accounts[1].password},source.key);
  const sessionId=JSON.parse(Buffer.from(revoked.access_token.split('.')[1],'base64url')).session_id;
  assert.match(sessionId,/^[0-9a-f-]{36}$/i);
  const sessionCount=stack=>scalar(stack,`select count(*)::int from auth.sessions where id='${sessionId}';`);
  const deletedAccountCount=stack=>scalar(stack,`select count(*)::int from auth.users where id='${accounts[2].id}';`);
  assert.equal(await sessionCount(source),1);
  const acceptedRequests=[];
  async function upload(bundle){for(const request of await writingUploadRequests(bundle)){await api(source,'/rest/v1/rpc/circle_writing_apply',{request},token);acceptedRequests.push(request);}}
  let bundle=fixture(accounts[0].id);
  for(const [entryId,kind,body] of [['note','note','Synthetic restored Note'],['thought','deep-thought','Synthetic restored answer'],['cleared','note','Clear this synthetic text'],['deleted-later','note','Synthetic deleted after backup']]){
    bundle=await save(bundle,{entryId,kind,body,title:entryId==='note'?'Restored note':'Synthetic '+entryId,source:kind==='deep-thought'?{question:'Synthetic backup question',questionId:'backup-question',source:'synthetic'}:null});
  }
  bundle=await save(bundle,{entryId:'note',body:'Synthetic restored Note revision two',title:'Restored note'});
  bundle=await save(bundle,{entryId:'cleared',body:'',title:''});await upload(bundle);
  const remote={inventory:after_id=>api(source,'/rest/v1/rpc/circle_writing_inventory',{after_id},token),receipts:operation_ids=>api(source,'/rest/v1/rpc/circle_writing_receipts',{operation_ids},token),apply:request=>api(source,'/rest/v1/rpc/circle_writing_apply',{request},token),resolve:request=>api(source,'/rest/v1/rpc/circle_writing_resolve',{request},token),resolutions:after_id=>api(source,'/rest/v1/rpc/circle_writing_resolution_history',{after_id,page_size:50},token)};
  const one=memoryStore(fixture(accounts[0].id));await syncAccountWriting({store:one,remote});
  one.replace(await save(await one.read(),{entryId:'conflict',kind:'thought',body:'Synthetic conflict original'}));await syncAccountWriting({store:one,remote});
  const two=memoryStore(structuredClone(await one.read()));
  one.replace(await save(await one.read(),{entryId:'conflict',kind:'thought',body:'Synthetic cloud branch'}));
  two.replace(await save(await two.read(),{entryId:'conflict',kind:'thought',body:'Synthetic local branch'}));
  await syncAccountWriting({store:one,remote});
  const staleRequest=(await writingUploadRequests(await two.read()))[0];
  assert.equal((await remote.apply(staleRequest)).status,'conflict','server-side competing snapshot retained');
  await syncAccountWriting({store:two,remote});
  const choice=await prepareWritingChoice(await two.read(),'conflict','cloud',new Date().toISOString(),'v_'+randomUUID());
  await two.update(current=>queueWritingChoice(current,choice));await syncAccountWriting({store:two,remote});
  one.replace(await save(await one.read(),{entryId:'trashed',body:'Synthetic recoverable Trash'}));
  one.replace(await commit(await one.read(),{type:'trash',entryId:'trashed',expectedGeneration:(await one.read()).state.entries.trashed.generation}));await syncAccountWriting({store:one,remote});
  assert.ok(await scalar(source,'select count(*)::int from circle_private.writing_conflicts;'),'conflict fixture exists');
  assert.ok(await scalar(source,'select count(*)::int from circle_private.writing_resolutions;'),'resolution fixture exists');
  // Test content rows are deliberately bounded; full authoring UI has separate acceptance.
  await sql(source,`insert into public.circle_quotes(text,author) values ('Synthetic recovery quotation','Synthetic');`);
  const asset=randomUUID(),image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1cAAAAASUVORK5CYII=','base64');
  let media;
  for(let attempt=0;attempt<30;attempt++){
    media=await fetch(source.host+'/storage/v1/object/circle-content/'+asset,{method:'POST',headers:{apikey:source.key,Authorization:'Bearer '+source.secret,'Content-Type':'image/png'},body:image,signal:AbortSignal.timeout(5000)});
    if(media.ok||media.status<500)break;
    await pause(500);
  }
  if(!media.ok){
    const failure=await media.json().catch(()=>({}));
    throw Error(`Synthetic media upload HTTP ${media.status}: ${failure.error||failure.code||'no Storage error code'}`);
  }
  await sql(source,`insert into public.circle_content_assets(id,alt,mime,bytes) values ('${asset}','Synthetic pixel','image/png',${image.length});`);
  await sql(source,`insert into public.circle_content_admins values ('${accounts[0].id}');`);
  const draft={draftId:'synthetic-restore-article',article:{title:'Synthetic restored article',blocks:[{type:'paragraph',text:'Synthetic edition one'},{type:'image',image:{assetId:asset,alt:'Synthetic pixel'}}]}};
  for(let version=1;version<=2;version++){
    if(version===2)draft.article.blocks[0].text='Synthetic edition two';
    await api(source,'/rest/v1/rpc/circle_save_content_draft',{draft,expected_revision:version-1,operation_id:randomUUID()},token);
    await api(source,'/rest/v1/rpc/circle_catalog_change',{command:{action:'publish',id:draft.draftId,draftId:draft.draftId,draftRevision:version,draft,expectedRevision:version-1,operationId:randomUUID()}},token);
  }
  const expected=await inventory(source),backupAt=new Date().toISOString(),backupStart=performance.now();
  // Managed auth/storage schemas already exist in target. Dump their selected data,
  // custom application schemas/functions/policies, and a synthetic cluster role separately.
  await sql(source,`create role "${tag.replaceAll('-','_')}_test" nologin;`);
  const schema=await d(['exec',source.db,'pg_dump','-U','postgres','-d','postgres','--schema-only','--schema','public','--schema','circle_private']);
  const data=await d(['exec',source.db,'pg_dump','-U','postgres','-d','postgres','--data-only','--schema','public','--schema','circle_private','--disable-triggers']);
  const managed=await d(['exec',source.db,'pg_dump','-U','postgres','-d','postgres','--data-only','--table','auth.users','--table','auth.identities','--table','auth.sessions','--table','auth.refresh_tokens','--table','storage.buckets','--table','storage.objects','--disable-triggers']);
  const roleName=tag.replaceAll('-','_')+'_test';
  const roleDump=(await d(['exec',source.db,'pg_dumpall','-U','postgres','--roles-only','--no-role-passwords'])).toString();
  const roleSQL=Buffer.from(roleDump.split('\n').filter(line=>line.startsWith('CREATE ROLE '+roleName+';')||line.startsWith('ALTER ROLE '+roleName+' ')).join('\n')+'\n');assert.ok(roleSQL.toString().includes('CREATE ROLE'),'dump synthetic role');
  const backup=Buffer.concat([roleSQL,schema,managed,data]),manifest={sha256:hash(backup),backupAt,bytes:backup.length,imageHash:hash(image)};
  await writeFile(resolve(root,'synthetic-backup.sql'),backup);await writeFile(resolve(root,'manifest.json'),JSON.stringify(manifest));
  const mediaArchive=await d(['exec',source.storageName,'tar','-C',source.storagePath,'-cf','-','.']);
  manifest.mediaHash=hash(mediaArchive);await writeFile(resolve(root,'synthetic-media.tar'),mediaArchive);await writeFile(resolve(root,'manifest.json'),JSON.stringify(manifest));
  console.log('Local media archive',{sourceTenant:source.tenant,storagePath:source.storagePath,bytes:mediaArchive.length});
  report.backupMs=Math.round(performance.now()-backupStart);report.backupBytes=backup.length;
  report.inventoryCounts=expected.map(row=>({table:row.table,rows:row.rows.length}));
  assert.throws(()=>verifiedArtifact(Buffer.concat([backup,Buffer.from('corrupt')]),manifest));
  await assert.rejects(readFile(resolve(root,'missing-backup.sql')));
  const deletionStore=memoryStore(fixture(accounts[0].id));await syncAccountWriting({store:deletionStore,remote});
  const staleEdit=await save(await deletionStore.read(),{entryId:'deleted-later',body:'Synthetic stale device edit',title:'Synthetic deleted-later'});
  const [staleUpload]=await writingUploadRequests(staleEdit);
  assert.equal(staleUpload.entryId,'deleted-later');
  deletionStore.replace(await save(await deletionStore.read(),{entryId:'note',body:'Synthetic newer accepted edit after backup',title:'Restored note'}));
  await syncAccountWriting({store:deletionStore,remote});
  for(const type of ['trash','delete']){const current=await deletionStore.read();deletionStore.replace(await commit(current,{type,entryId:'deleted-later',expectedGeneration:current.state.entries['deleted-later'].generation,confirmed:true}));}
  let deletionRequest;
  await syncAccountWriting({store:deletionStore,remote:{...remote,apply:async request=>{
    const result=await remote.apply(request);
    if(result.status==='accepted'&&request.entryId==='deleted-later')deletionRequest=request;
    return result;
  }}});
  assert.ok(deletionRequest?.snapshot.tombstone);
  assert.equal(deletionRequest.snapshot.entry,null);
  assert.ok((await remote.inventory('')).find(h=>h.entryId==='deleted-later')?.snapshot.tombstone,'source deletion accepted before restore');
  await api(source,'/auth/v1/admin/users/'+accounts[2].id,undefined,source.secret,'DELETE');
  await api(source,'/auth/v1/logout?scope=local',undefined,revoked.access_token);
  assert.equal(await sessionCount(source),0,'source session revoked');
  const journalPath=resolve(root,'synthetic-recovery-journal.json');
  const journalBytes=JSON.stringify({backup:manifest.sha256,events:[
    {kind:'entry-deleted',request:deletionRequest},
    {kind:'account-deleted',id:accounts[2].id},
    {kind:'session-revoked',id:sessionId},
  ]});
  const journalHash=hash(journalBytes);
  await writeFile(journalPath,journalBytes,{flag:'wx'});
  const restoreInterrupted=Error('Synthetic reconciliation interrupted after entry deletion');
  const loginAs=(stack,account)=>api(stack,'/auth/v1/token?grant_type=password',{email:account.email,password:account.password},stack.key);
  async function reconcile(stack,path,token,{interrupt=false}={}){
    const bytes=await readFile(path);
    assert.equal(hash(bytes),journalHash,'complete recovery journal');
    const journal=JSON.parse(bytes);
    assert.equal(journal.backup,manifest.sha256,'journal belongs to the restore point');
    const [entry,account,session]=journal.events;
    assert.deepEqual(journal.events.map(event=>event.kind),['entry-deleted','account-deleted','session-revoked']);
    const receipt=await api(stack,'/rest/v1/rpc/circle_writing_apply',{request:entry.request},token);
    assert.equal(receipt.status,'accepted','original deletion receipt accepted on replay');
    if(interrupt)throw restoreInterrupted;
    if(await deletedAccountCount(stack))await api(stack,'/auth/v1/admin/users/'+account.id,undefined,stack.secret,'DELETE');
    await sql(stack,`begin; delete from auth.refresh_tokens where session_id='${session.id}'; delete from auth.sessions where id='${session.id}'; commit;`,true);
    return receipt;
  }
  assert.equal((await remote.inventory('')).find(h=>h.entryId==='note').snapshot.entry.versions.at(-1).content.body,'Synthetic newer accepted edit after backup');
  report.backupAt=backupAt;report.simulatedLossAt=new Date().toISOString();
  report.simulatedLossWindowMs=Date.parse(report.simulatedLossAt)-Date.parse(backupAt);
  const target=await localStack('target',55500);
  await requireRecoverySessions(target);
  await sql(target,'drop schema public cascade;');
  await restore(target,verifiedArtifact(backup,manifest),{interrupt:true});report.interruptionRollback=true;
  for(let iteration=0;iteration<2;iteration++){
    if(iteration){
      await sql(target,`drop schema circle_private cascade; drop schema public cascade; truncate auth.refresh_tokens,auth.sessions,auth.identities,auth.users,storage.objects,storage.buckets cascade; drop role "${tag.replaceAll('-','_')}_test";`,true);
    }
    const restoreMs=await restore(target,verifiedArtifact(await readFile(resolve(root,'synthetic-backup.sql')),manifest));
    assert.ok(target.storagePath.startsWith('/')&&target.storagePath!=='/','owned media mount path');
    await d(['restart',target.storageName]);
    await storageExec(target,['find',target.storagePath,'-mindepth','1','-delete']);
    assert.equal(hash(await readFile(resolve(root,'synthetic-media.tar'))),manifest.mediaHash,'media archive checksum');
    await storageExec(target,['tar','-C',target.storagePath,'-xf','-'],mediaArchive);
    if(source.tenant&&target.tenant&&source.tenant!==target.tenant){
      assert.match(source.tenant,/^[a-zA-Z0-9_-]+$/);assert.match(target.tenant,/^[a-zA-Z0-9_-]+$/);
      await storageExec(target,['mv',target.storagePath+'/'+source.tenant,target.storagePath+'/'+target.tenant]);
    }
    const actual=await inventory(target);
    assert.equal(hash(Buffer.from(JSON.stringify(actual))),hash(Buffer.from(JSON.stringify(expected))),'exact restored row digest, including Auth (values withheld)');
    assert.equal(await deletedAccountCount(target),1,'older snapshot contains deleted account');
    assert.equal(await sessionCount(target),1,'older snapshot contains revoked session');
    const {access_token: recoveryToken}=await loginAs(target,accounts[0]);
    await assert.rejects(reconcile(target,resolve(root,'missing-journal.json'),recoveryToken),{code:'ENOENT'});
    const damagedJournal=resolve(root,'damaged-journal.json');await writeFile(damagedJournal,journalBytes.slice(0,-1));
    await assert.rejects(reconcile(target,damagedJournal,recoveryToken),/complete recovery journal/);
    const reconciliationStart=performance.now();
    await assert.rejects(reconcile(target,journalPath,recoveryToken,{interrupt:true}),error=>error===restoreInterrupted);
    assert.equal(await deletedAccountCount(target),1,'interruption happened before account deletion');
    assert.equal(await sessionCount(target),1,'interruption happened before session revocation');
    const receipt=await reconcile(target,journalPath,recoveryToken);
    const safeInventory=await inventory(target);
    assert.deepEqual(await reconcile(target,journalPath,recoveryToken),receipt,'repeating reconciliation returns the same deletion receipt');
    assert.deepEqual(await inventory(target),safeInventory,'repeated journal leaves restored writing and account rows unchanged');
    const reconciliationMs=Math.round(performance.now()-reconciliationStart);
    assert.equal(await deletedAccountCount(target),0);
    assert.equal(await sessionCount(target),0);
    const deletedLogin=await requestLocal(target,'/auth/v1/token?grant_type=password',{email:accounts[2].email,password:accounts[2].password},target.key);
    assert.equal(deletedLogin.status,400,'deleted account credentials denied');
    const refresh=await requestLocal(target,'/auth/v1/token?grant_type=refresh_token',{refresh_token:revoked.refresh_token},target.key);
    assert.ok([400,401].includes(refresh.status),'revoked refresh token denied');
    for(const [rpc,body] of [['inventory',{after_id:''}],['apply',{request:staleUpload}]]){
      const denied=await requestLocal(target,'/rest/v1/rpc/circle_writing_'+rpc,body,revoked.access_token);
      assert.equal(denied.status,401,'old access token denied after its session is removed');
      assert.equal((await denied.json()).message,'Recovery session is not active','the live-session guard denied the token');
    }
    await d(['restart',target.storageName]);
    let downloaded;
    for(let attempt=0;attempt<90;attempt++){
      try{downloaded=await fetch(target.host+'/storage/v1/object/authenticated/circle-content/'+asset,{headers:{apikey:target.key,Authorization:'Bearer '+target.secret},signal:AbortSignal.timeout(2000)});if(downloaded.ok)break;}catch{}await pause(500);
    }
    if(!downloaded?.ok){
      const logs=(await d(['logs','--tail','12',target.storageName],{combined:true})).toString();
      for(const line of logs.split('\n'))try{const item=JSON.parse(line);console.log('Local Storage diagnostic',item.error?.message||item.msg||item.message||item.level);}catch{}
      console.log('Synthetic file paths',(await d(['exec',target.storageName,'find',target.storagePath,'-type','f'])).toString().slice(0,2000));
    }
    assert.ok(downloaded?.ok,'restored media readable HTTP '+downloaded?.status);assert.equal(hash(Buffer.from(await downloaded.arrayBuffer())),manifest.imageHash);
    const login=await api(target,'/auth/v1/token?grant_type=password',{email:accounts[0].email,password:accounts[0].password},target.key);
    const b=await api(target,'/auth/v1/token?grant_type=password',{email:accounts[1].email,password:accounts[1].password},target.key);
    assert.deepEqual(await api(target,'/rest/v1/rpc/circle_writing_inventory',{after_id:''},b.access_token),[]);
    const anonymous=await fetch(target.host+'/rest/v1/rpc/circle_writing_inventory',{method:'POST',headers:{apikey:target.key,Authorization:'Bearer '+target.key,'Content-Type':'application/json'},body:'{"after_id":""}'});assert.equal(anonymous.ok,false);
    const heads=await api(target,'/rest/v1/rpc/circle_writing_inventory',{after_id:''},login.access_token);
    assert.equal(heads.find(h=>h.entryId==='note').snapshot.entry.versions.at(-1).content.body,'Synthetic restored Note revision two','post-backup accepted edit is outside snapshot');
    const original=acceptedRequests.find(request=>request.entryId==='note');assert.ok(original);
    assert.equal((await api(target,'/rest/v1/rpc/circle_writing_apply',{request:original},login.access_token)).status,'accepted','original request retry returns its receipt');
    const stale=await api(target,'/rest/v1/rpc/circle_writing_apply',{request:staleUpload},login.access_token);
    assert.equal(stale.status,'deleted','stale device upload cannot recreate deleted entry');
    const afterRetry=(await inventory(target)).filter(row=>row.table.startsWith('circle_private.'));
    assert.deepEqual(afterRetry,safeInventory.filter(row=>row.table.startsWith('circle_private.')),'retry and stale upload preserve writing and receipts');
    const deletedHead=heads.find(h=>h.entryId==='deleted-later');
    assert.ok(deletedHead?.snapshot.tombstone);
    assert.equal(deletedHead.snapshot.entry,null,'restored text scrubbed');
    report.runs.push({iteration:iteration+1,restoreMs,reconciliationMs,exactRows:true,media:true,isolation:true,safeRetry:true,newerAcceptedEditLost:true,deletionSuppression:true,revokedSessionDenied:true});
    console.log('PASS reconciliation '+(iteration+1)+'; newer accepted edit is outside the backup.');
    const appInfo=await buildApp(target,iteration>0);
    await writeFile(resolve(root,'browser-input.json'),JSON.stringify({origin:appInfo.origin,host:target.host,key:target.key,account:accounts[0],other:accounts[1]}));
    env.CIRCLE_BACKUP_RESTORE_INPUT=resolve(root,'browser-input.json');
    console.log((await run(process.execPath,['--test','tests/backup-restore.browser.mjs'],{cwd:repo,timeout:240000})).toString());
    const appExit=once(appInfo.app,'exit');appInfo.app.kill();await appExit;
    report.runs.at(-1).browser=true;
  }
  report.browser=true;report.finishedAt=new Date().toISOString();
}finally{
  const cleanupStarted=performance.now();
  for(const child of children)child.kill();
  const failures=[];
  for(const stack of stacks.reverse()){
    try{assert.ok(stack.id.startsWith(tag+'-'));await run(cli,['stop','--workdir',stack.dir,'--project-id',stack.id,'--no-backup'],{timeout:180000});
      for(const kind of ['container','volume'])assert.equal((await d([kind,'ls','-q','--filter','label=com.supabase.cli.project='+stack.id])).toString().trim(),'','owned '+kind+' cleanup');
    }catch(error){failures.push(error.message);}
  }
  if(networkCreated)try{await d(['network','rm',network]);}catch(error){failures.push(error.message);}
  for(const image of images)try{await d(['image','rm',image]);}catch(error){failures.push(error.message);}
  assert.ok(root.startsWith(outputs+sep));
  if(!failures.length)try{const junction=resolve(root,'build/node_modules');await rm(junction,{recursive:true,force:true});await rm(root,{recursive:true,force:true});report.artifactsRemoved=true;}catch(error){failures.push('Temporary artifact cleanup: '+error.code);}
  report.cleanup=failures.length===0;report.cleanupMs=Math.round(performance.now()-cleanupStarted);
  await writeFile(resolve(outputs,'backup-restore-result.json'),JSON.stringify({...report,cleanupFailures:failures},null,2));
  assert.deepEqual(failures,[],'owned resources cleaned');
}
