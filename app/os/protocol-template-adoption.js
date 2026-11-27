import {activeProtocolRun,startProtocolDraft,renameProtocolRun,setProtocolDays,addProtocolItem,updateProtocolItem,beginProtocolRun,getDateKey,PROTOCOL_DURATIONS} from './circle-os-model.js';
import {confirmedTemplate,templateSourceSnapshot} from './template-adoption-record.js';

/** Deliberate local adoption. Preview alone never calls this function. */
export function startProtocolTemplate(state,{template,sourceId,version,operationId,days,answers={},dateKey=getDateKey()}) {
  if(!sourceId||!Number.isInteger(version)||version<1||!/^[-a-zA-Z0-9]{1,128}$/.test(operationId||''))throw Error('This template version is unavailable.');
  const prior=Object.values(state.protocol.runs).find(run=>run.sourceTemplate?.operationId===operationId);
  if(prior){if(prior.sourceTemplate.id!==sourceId||prior.sourceTemplate.version!==version)throw Error('This start request belongs to another template.');return {state,id:prior.id};}
  if(activeProtocolRun(state))throw Error('You already have an active phase or unfinished draft. Open Protocol to review it.');
  if(template.kind!=='protocol'||!PROTOCOL_DURATIONS.includes(days))throw Error('Choose a valid Protocol duration.');
  const result=confirmedTemplate(template,answers);
  if(template.title.length>60||result.items.some(item=>!item.action.trim()||item.action.length>120))throw Error('The phase name or a term is too long for Protocol. Ask the author to shorten it.');
  const id='template-'+operationId;
  if(state.protocol.runs[id])throw Error('A phase already uses this start request. Open Protocol to review it.');
  let next=startProtocolDraft(state,id).state;
  next=renameProtocolRun(next,id,template.title);next=setProtocolDays(next,id,days);
  for(const item of result.items){const added=addProtocolItem(next,id,item.kind,id+'-'+item.id);next=updateProtocolItem(added.state,id,added.id,item.action,dateKey);}
  next=beginProtocolRun(next,id,dateKey);
  const adoptedAt=next.protocol.runs[id].startedAt;
  const sourceTemplate=templateSourceSnapshot(template,result,answers,{sourceId,version,operationId,adoptedAt});
  return {state:{...next,protocol:{...next.protocol,runs:{...next.protocol.runs,[id]:{...next.protocol.runs[id],sourceTemplate}}}},id};
}
