import assert from "node:assert/strict";
import test from "node:test";
import { activateAccountScope } from "../app/os/account-scope.js";
import { createWritingTransport } from "../app/os/writing-transport.ts";

const storage = new Map();
globalThis.window = { localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value) }, addEventListener() {} };
const config = { url:"https://synthetic.supabase.test",key:"synthetic-publishable-key" };
function session(id = "account-a", token = "synthetic-access-token") {
  return { data:{session:{user:{id},access_token:token}},error:null };
}
function auth(getSession, verifiedId = "account-a") {
  return { getSession, getUser: async () => ({ data:{user:{id:verifiedId,email_confirmed_at:"2026-11-05T03:00:00.000Z"}},error:null }) };
}
test("transport pins the account token and uses uncached POST RPCs with an abort signal", async () => {
  const scope=activateAccountScope("account-a"), calls=[];
  const api=createWritingTransport({auth:auth(async()=>session())},config,scope,async (url,init)=> {
    calls.push({url,init}); return Response.json([]);
  });
  await api.inventory(""); await api.receipts(["operation"]); await api.apply({requestId:"test"});
  assert.deepEqual(calls.map(c=>c.url),["circle_writing_inventory","circle_writing_receipts","circle_writing_apply"].map(name=>`${config.url}/rest/v1/rpc/${name}`));
  for (const {init} of calls) {
    assert.equal(init.headers.Authorization,"Bearer synthetic-access-token"); assert.equal(init.headers.apikey,config.key);
    assert.equal(init.method,"POST"); assert.equal(init.cache,"no-store"); assert.equal(init.redirect,"error"); assert.ok(init.signal);
  }
  assert.deepEqual(JSON.parse(calls[0].init.body),{after_id:"",page_size:50});
});
test("missing, expired-error or other-account session makes no request", async () => {
  for (const reply of [{data:{session:null},error:null},session("account-b"),{...session(),error:new Error("expired")}]) {
    const scope=activateAccountScope("account-a"); let calls=0;
    const api=createWritingTransport({auth:auth(async()=>reply)},config,scope,async()=>{calls++;return Response.json([]);});
    await assert.rejects(api.inventory(""),/Sign in again/); assert.equal(calls,0);
  }
});
test("account switch during token retrieval prevents the request", async () => {
  const scope=activateAccountScope("account-a"); let calls=0;
  const api=createWritingTransport({auth:auth(async()=>{activateAccountScope("account-b");return session();})},config,scope,async()=>{calls++;return Response.json([]);});
  await assert.rejects(api.inventory(""),/account changed/); assert.equal(calls,0);
});
test("late responses and bodies after logout cannot acknowledge writing", async () => {
  for (const lateBody of [false,true]) {
    const scope=activateAccountScope("account-a"); let signal;
    const api=createWritingTransport({auth:auth(async()=>session())},config,scope,async (_url,init)=>{
      signal=init.signal;
      if (!lateBody) {activateAccountScope(null);return Response.json([]);}
      return {ok:true,json:async()=>{activateAccountScope(null);return [];}};
    });
    await assert.rejects(api.inventory(""),/account changed/); assert.equal(signal.aborted,true);
  }
});
test("backend errors are safe to report and leave their private body unread", async () => {
  const scope=activateAccountScope("account-a"); let read=false;
  const api=createWritingTransport({auth:auth(async()=>session())},config,scope,async()=>({ok:false,status:401,json:()=>{read=true;throw new Error("private");}}));
  await assert.rejects(api.inventory(""),/could not finish \(401\)/); assert.equal(read,false);
});
test("insecure or credential-bearing endpoint configuration is rejected", () => {
  const scope=activateAccountScope("account-a"), client={auth:auth(async()=>session())};
  for (const url of ["http://elsewhere.test","https://name:password@elsewhere.test","https://elsewhere.test/path"]) {
    assert.throws(()=>createWritingTransport(client,{...config,url},scope),/Invalid writing transport/);
  }
});
test("a stored session identity cannot disguise the token's verified account",async()=>{
  const scope=activateAccountScope("account-a");let calls=0;
  const api=createWritingTransport({auth:auth(async()=>session(),"account-b")},config,scope,async()=>{calls++;return Response.json([]);});
  await assert.rejects(api.inventory(""),/Sign in again/);assert.equal(calls,0);
});
test("failed verification, unconfirmed email and account change during verification block uploads",async()=>{
  for(const scenario of ["error","unconfirmed","switch"]){
    const scope=activateAccountScope("account-a");let calls=0;
    const adapter=auth(async()=>session());adapter.getUser=async()=>{
      if(scenario==="switch")activateAccountScope("account-b");
      return {data:{user:{id:"account-a",email_confirmed_at:scenario==="unconfirmed"?null:"2026-11-05T03:00:00.000Z"}},error:scenario==="error"?new Error("revoked"):null};
    };
    const api=createWritingTransport({auth:adapter},config,scope,async()=>{calls++;return Response.json([]);});
    await assert.rejects(api.inventory(""),/Sign in again|account changed/);assert.equal(calls,0);
  }
});
