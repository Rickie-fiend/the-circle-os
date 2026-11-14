import { accountAdmin, adminFailure } from '../account-admin-server';
import { validateChapterDraft } from '../chapter-authoring.js';
import { publishedChapters } from '../../chapters/registry';
import { validateTemplate } from '../template-model.js';
export async function POST(request:Request) {
 try {
  const {url,headers}=await accountAdmin(request);
  const command=await request.json();
  if(JSON.stringify(command).length>500000) return Response.json({error:'Content too large'},{status:400});
  if(command.action==='publish') {
   const d=command.draft;
   if(d?.template) {
    if(d.article || validateTemplate(d.template).length) return Response.json({error:'Finish template fields and personalization rules'},{status:400});
   } else if(d?.article) {
    if(!d.article.title?.trim()||!Array.isArray(d.article.blocks)||d.article.blocks.some((b:{type:string;text?:string;image?:{assetId?:string;alt?:string}})=>!['heading','paragraph','image'].includes(b.type)||(b.type==='image'?(!b.image?.assetId||!b.image.alt?.trim()):!b.text?.trim()))) return Response.json({error:'Finish article fields'},{status:400});
   } else if(validateChapterDraft(d).length||publishedChapters.some(c=>c.id===d.chapter.id)) return Response.json({error:'Invalid chapter or reserved bundled identity. Use an independent copy.'},{status:400});
  }
  const response=await fetch(`${url}/rest/v1/rpc/circle_catalog_change`,{method:'POST',headers,body:JSON.stringify({command}),cache:'no-store',signal:AbortSignal.timeout(12000)});
  return Response.json(await response.json(),{status:response.ok?200:409,headers:{'Cache-Control':'no-store'}});
 } catch(error) {return adminFailure(error);}
}
