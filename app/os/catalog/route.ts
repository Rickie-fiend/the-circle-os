import { catalogAccount } from './server';
export async function GET(request:Request) {
 try {
  const {url,headers}=await catalogAccount(request), query=new URL(request.url).searchParams;
  const response=await fetch(`${url}/rest/v1/rpc/circle_catalog_read`,{method:'POST',headers,body:JSON.stringify({item:query.get('id'),edition:query.get('version')?Number(query.get('version')):null}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok) return Response.json({error:'Catalog unavailable'},{status:503});
  let data=await response.json();
  // Explore never includes withdrawn publications, including for an Admin.
  // The existing Admin catalog continues to receive its full listing.
  if(query.get('view')==='explore') {
   if(!Array.isArray(data))return Response.json({error:'Catalog unavailable'},{status:503});
   data=data.filter(item=>!item.withdrawn&&['chapter','article','routine-template','protocol-template'].includes(item.kind)).map(({id,kind,version,title,description,cover})=>({id,kind,version,title,description,cover}));
  }
  return Response.json(data,{status:data===null?404:200,headers:{'Cache-Control':'private, no-store'}});
 } catch {return Response.json({error:'Sign in required'},{status:403});}
}
