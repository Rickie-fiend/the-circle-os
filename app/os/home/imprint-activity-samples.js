import {acceptActivity,activityDay,emptyActivity} from './imprint-activity-model.js';

export const studyNow = () => new Date(2026,10,17,21).toISOString();
export function sampleAction(kind, source, at=studyNow(), owner='sample-one', extras={}) {
 return {kind,source,owner,at,operation:`accept-${source}`,day:activityDay(at),accepted:true,changed:true,firstSave:true,nonempty:true,origin:'routine',endAt:at,savedAt:at,...extras};
}
export function activitySample() {
 let state=emptyActivity();
 const kinds=['chapter-finished','note-saved','thought-sent','habit-completed','log-ended','protocol-sealed'];
 for(let day=1;day<=30;day++)for(const [index,kind] of kinds.entries()) {
  if(day%[9,2,5,1,2,4][index]!==0)continue;
  const at=new Date(2026,9,day,9).toISOString();
  state=acceptActivity(state,sampleAction(kind,`old-${index}-${day}`,at)).state;
 }
 state=acceptActivity(state,sampleAction('note-saved','today-note')).state;
 // The second owner deliberately shares identities, demonstrating owner isolation.
 state=acceptActivity(state,sampleAction('note-saved','today-note',studyNow(),'sample-two')).state;
 return state;
}
