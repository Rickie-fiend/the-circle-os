"use client";
import { useEffect, useState } from 'react';
import type { ChapterDraft } from './chapter-authoring.js';
import { ContentImagePicker } from './content-media';
import { createTemplateDraft, createTemplateItem, createTemplatePage, fixedValue, validateTemplate } from './template-model.js';
import { TemplatePreview } from './template-preview';
import type { TemplateDraft, TemplateItem, TemplatePage, TemplateValue } from './template-types';

type Repository = {read():Promise<ChapterDraft[]>;write(draft:ChapterDraft):Promise<unknown>;recover?(draft:ChapterDraft):void};
const pageKinds = ['info','preview','single-choice','multi-choice','short-text','long-text','time','number'];
export function TemplateEditor({repository,kind}:{repository:Repository;kind:'routine'|'protocol'}) {
  const [draft,setDraft]=useState<TemplateDraft>(()=>createTemplateDraft(kind));
  const [library,setLibrary]=useState<TemplateDraft[]>([]);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('Opening templates…');
  const [pageKind,setPageKind]=useState('info');
  const [effortItems,setEffortItems]=useState<string[]>([]);
  useEffect(()=>{let active=true;void repository.read().then(rows=>{if(!active)return;const templates=(rows as TemplateDraft[]).filter(row=>row.template?.kind===kind);setLibrary(templates);if(templates.length)setDraft(templates[0]);setReady(true);setMessage('');}).catch(()=>{if(active)setMessage('Could not open templates. Reopen this tool to retry.');});return()=>{active=false;};},[repository,kind]);
  useEffect(()=>{if(ready){try{repository.recover?.(draft);}catch{ /* Explicit save reports storage errors. */ }}},[draft,ready,repository]);
  function change(edit:(copy:TemplateDraft)=>void){setDraft(current=>{const copy=structuredClone(current);edit(copy);copy.updatedAt=new Date().toISOString();copy.chapter.title=copy.template.title;return copy;});setMessage('Unsaved changes');}
  async function save(){if(busy)return;setBusy(true);const snapshot=structuredClone(draft);try{await repository.write(snapshot);setLibrary(rows=>[snapshot,...rows.filter(row=>row.draftId!==snapshot.draftId)]);setMessage('Saved online');}catch(error){setMessage(error instanceof Error?error.message:'Could not save. Your device copy is retained.');}finally{setBusy(false);}}
  function move<T>(array:T[],index:number,offset:number){const other=index+offset;if(other<0||other>=array.length)return;[array[index],array[other]]=[array[other],array[index]];}
  function pageChange(index:number,edit:(page:TemplatePage)=>void){change(copy=>edit(copy.template.pages[index]));}
  function itemChange(index:number,edit:(item:TemplateItem)=>void){change(copy=>edit(copy.template.items[index]));}
  if(!ready)return <p role="status">{message}</p>;
  const errors=validateTemplate(draft.template);
  return <main className="os-admin os-template-editor"><h1>{kind==='routine'?'Habit and task templates':'Protocol templates'}</h1><p role="status">{message}</p>
    <fieldset disabled={busy} className="os-admin-panel os-admin-fields"><legend>Template</legend>
      <button type="button" onClick={()=>{setDraft(createTemplateDraft(kind));setMessage('New template');}}>New template</button>
      <label className="os-admin-field">Saved template<select value={library.some(d=>d.draftId===draft.draftId)?draft.draftId:''} onChange={event=>{const selected=library.find(d=>d.draftId===event.target.value);if(selected)setDraft(selected);}}><option value="">Choose a template</option>{library.map(d=><option key={d.draftId} value={d.draftId}>{d.template.title||'Untitled template'}</option>)}</select></label>
      <label className="os-admin-field">Explore name<input value={draft.template.title} onChange={event=>change(copy=>{copy.template.title=event.target.value;})}/></label>
      <label className="os-admin-field">Description<textarea value={draft.template.description} onChange={event=>change(copy=>{copy.template.description=event.target.value;})}/></label>
      <h2>Cover image</h2><ContentImagePicker value={draft.template.cover} onChange={image=>change(copy=>{copy.template.cover=image;})}/>
      <h2>Setup Pages</h2><p>These are the Pages the person reads and answers. Fill Question for every question Page; Page title is optional. Items below define what they receive. A final result preview is included automatically; extra preview Pages are optional and use answers given so far.</p>
      {draft.template.pages.map((page,index)=><section key={page.id} className="os-admin-panel" aria-label={`Template Page ${index+1}`}><h3>Page {index+1}: {page.inputFormat==='number'?'number':page.type}</h3>
        {errors.filter(error=>error.startsWith(`Page ${index+1}:`)).map(error=><p role="alert" key={error}>{error}</p>)}
        <label className="os-admin-field">Page title<input value={page.title||''} onChange={event=>pageChange(index,p=>{p.title=event.target.value;})}/></label>
        <label className="os-admin-field">Page text<textarea value={page.body||''} onChange={event=>pageChange(index,p=>{p.body=event.target.value;})}/></label>
        <label className="os-admin-field">Page purpose<select value={page.purpose} onChange={event=>pageChange(index,p=>{p.purpose=event.target.value as TemplatePage['purpose'];})}>{(page.type==='info'?['content','preview']:['configuration','reflection']).map(purpose=><option key={purpose}>{purpose}</option>)}</select></label>
        <ContentImagePicker value={page.image} onChange={image=>pageChange(index,p=>{p.image=image;})}/>
        <label className="os-admin-field">Image placement<select value={page.imagePlacement||'after-text'} onChange={event=>pageChange(index,p=>{p.imagePlacement=event.target.value as TemplatePage['imagePlacement'];})}><option value="before-text">Before text</option><option value="after-text">After text</option></select></label>
        {page.type!=='info'&&<><label className="os-admin-field">Question<input value={page.question||''} onChange={event=>pageChange(index,p=>{p.question=event.target.value;})}/></label><label><input type="checkbox" checked={Boolean(page.required)} onChange={event=>pageChange(index,p=>{p.required=event.target.checked;})}/>Required answer</label></>}
        {page.inputFormat==='number'&&<><label className="os-admin-field">Minimum<input type="number" step="any" value={Number.isFinite(page.min)?page.min:''} onChange={event=>pageChange(index,p=>{p.min=event.target.value===''?NaN:Number(event.target.value);})}/></label><label className="os-admin-field">Maximum<input type="number" step="any" value={Number.isFinite(page.max)?page.max:''} onChange={event=>pageChange(index,p=>{p.max=event.target.value===''?NaN:Number(event.target.value);})}/></label></>}
        {['single-choice','multi-choice'].includes(page.type)&&<>{page.options?.map((option,optionIndex)=><div key={option.id}><label className="os-admin-field">Option {optionIndex+1}<input value={option.label} onChange={event=>pageChange(index,p=>{p.options![optionIndex].label=event.target.value;})}/></label><button type="button" onClick={()=>pageChange(index,p=>{p.options!.splice(optionIndex,1);})}>Remove option {optionIndex+1}</button></div>)}<button type="button" onClick={()=>pageChange(index,p=>{p.options!.push({id:`option-${crypto.randomUUID()}`,label:''});})}>Add option</button></>}
        <div className="os-admin-actions"><button type="button" disabled={!index} onClick={()=>change(copy=>move(copy.template.pages,index,-1))}>Move Page earlier</button><button type="button" disabled={index===draft.template.pages.length-1} onClick={()=>change(copy=>move(copy.template.pages,index,1))}>Move Page later</button><button type="button" onClick={()=>change(copy=>{const duplicate=structuredClone(page);duplicate.id=`page-${crypto.randomUUID()}`;duplicate.answerKey=duplicate.id;copy.template.pages.splice(index+1,0,duplicate);})}>Duplicate Page</button><button type="button" onClick={()=>change(copy=>{copy.template.pages.splice(index,1);})}>Remove Page</button></div>
      </section>)}
      <div className="os-admin-actions"><label className="os-admin-field">New Page type<select aria-label="New Page type" value={pageKind} onChange={event=>setPageKind(event.target.value)}>{pageKinds.map(type=><option key={type}>{type}</option>)}</select></label><button type="button" onClick={()=>change(copy=>{const page=createTemplatePage(pageKind==='preview'?'info':pageKind==='number'?'short-text':pageKind);page.imagePlacement='after-text';if(pageKind==='preview')page.purpose='preview';if(pageKind==='number'){page.inputFormat='number';page.min=0;page.max=1;}copy.template.pages.push(page);})}>Add Page</button></div>
      <h2>Items</h2><p>Each item is a habit or task in the result. Set fixed values, or choose Use an answer and link a required configuration question. For example: ask for a time, add “Read”, then link its cue to that question.</p>{draft.template.items.map((item,index)=><section className="os-admin-panel" key={item.id} aria-label={`Template item ${index+1}`}><h3>Item {index+1}</h3>
        <label className="os-admin-field">Item type<select value={item.kind} onChange={event=>itemChange(index,i=>{i.kind=event.target.value as TemplateItem['kind'];})}>{(kind==='routine'?['habit','task']:['non-negotiable','negotiable']).map(type=><option key={type}>{type}</option>)}</select></label>
        <label className="os-admin-field">Action<input value={item.action} onChange={event=>itemChange(index,i=>{i.action=event.target.value;})}/></label>
        <label className="os-admin-field">Action wording<input placeholder={item.action} value={item.actionPattern||''} onChange={event=>itemChange(index,i=>{i.actionPattern=event.target.value||undefined;})}/></label><div className="os-admin-actions">{(['target','unit','intensity'] as const).map(slot=><button key={slot} type="button" onClick={()=>itemChange(index,i=>{i.actionPattern=(i.actionPattern||i.action)+` {${slot}}`;})}>Insert {slot==='intensity'?'effort':slot}</button>)}</div>
        <label className="os-admin-field">Result or identity<input value={item.identity} onChange={event=>itemChange(index,i=>{i.identity=event.target.value;})}/></label>
        <label className="os-admin-field">Target unit<input value={item.unit} onChange={event=>itemChange(index,i=>{i.unit=event.target.value;})}/></label>
        {(['cue','target','intensity'] as const).filter(field=>field!=='intensity'||effortItems.includes(item.id)||item.intensity.source!=='fixed'||Boolean(item.intensity.value)).map(field=><ValueEditor key={field} label={field==='intensity'?'Effort (optional)':field} value={item[field]} pages={draft.template.pages} onChange={value=>itemChange(index,i=>{i[field]=value;})}/>)}
        {!effortItems.includes(item.id)&&item.intensity.source==='fixed'&&!item.intensity.value&&<button type="button" onClick={()=>setEffortItems(ids=>[...ids,item.id])}>Add effort</button>}
        {(effortItems.includes(item.id)||item.intensity.source!=='fixed'||Boolean(item.intensity.value))&&<button type="button" onClick={()=>{itemChange(index,i=>{i.intensity=fixedValue();});setEffortItems(ids=>ids.filter(id=>id!==item.id));}}>Remove effort</button>}
        <div className="os-admin-actions"><button type="button" disabled={!index} onClick={()=>change(copy=>move(copy.template.items,index,-1))}>Move item earlier</button><button type="button" disabled={index===draft.template.items.length-1} onClick={()=>change(copy=>move(copy.template.items,index,1))}>Move item later</button><button type="button" onClick={()=>change(copy=>{copy.template.items.splice(index+1,0,{...structuredClone(item),id:`item-${crypto.randomUUID()}`});})}>Duplicate item</button><button type="button" onClick={()=>change(copy=>{copy.template.items.splice(index,1);})}>Remove item</button></div>
      </section>)}
      <button type="button" onClick={()=>change(copy=>{copy.template.items.push(createTemplateItem(kind==='routine'?'habit':'non-negotiable'));})}>Add item</button>
      {kind==='protocol'&&draft.template.items.some(item=>item.identity.trim()||item.cue.source!=='fixed'||item.cue.value.trim())&&<p role="alert">Protocol shows one agreed term per item. Saved cue and result fields are retained but are not shown on the Protocol Page. Review those fields before publishing.</p>}
      {errors.length>0&&<ul aria-label="Before publishing">{[...new Set(errors)].map(error=><li key={error}>{error}</li>)}</ul>}
      <button type="button" onClick={()=>void save()}>{busy?'Saving…':'Save template draft'}</button>
    </fieldset>
    <h2>Preview</h2><TemplatePreview draft={draft}/>
  </main>;
}

function ValueEditor({label,value,pages,onChange}:{label:string;value:TemplateValue;pages:TemplatePage[];onChange:(value:TemplateValue)=>void}) {
  const linked=pages.find(page=>page.answerKey===value.answerKey);
  const change=(edit:Partial<TemplateValue>)=>onChange({...value,...edit});
  return <fieldset className="os-admin-fields"><legend>{label}</legend>
    <label className="os-admin-field">Value source<select aria-label="Value source" value={value.source} onChange={event=>onChange({...fixedValue(),source:event.target.value as TemplateValue['source']})}><option value="fixed">Fixed value</option><option value="answer">Use an answer</option><option value="choice">Match a choice</option>{label==='target'&&<option value="scale">Calculate from a number</option>}</select></label>
    {value.source==='fixed'?<label className="os-admin-field">Fixed {label}<input value={value.value} onChange={event=>change({value:event.target.value})}/></label>:<label className="os-admin-field">Question to use<select aria-label="Question to use" value={value.answerKey} onChange={event=>{const page=pages.find(p=>p.answerKey===event.target.value);change({answerKey:event.target.value,choices:page?.options?.map(o=>({answer:o.id,value:''}))||[]});}}><option value="">Choose a required configuration question</option>{pages.filter(p=>p.purpose==='configuration'&&p.required&&p.type!=='info').map(p=><option value={p.answerKey} key={p.id}>{p.question||p.title||'Untitled question'}</option>)}</select></label>}
    {value.source==='scale'&&<>{(['factor','offset','min','max'] as const).map(field=><label className="os-admin-field" key={field}>{field}<input type="number" step="any" value={Number.isFinite(value[field])?value[field]:''} onChange={event=>change({[field]:event.target.value===''?NaN:Number(event.target.value)})}/></label>)}<p>Answer × factor + offset, limited to min/max. These are your authored rules.</p></>}
    {value.source==='choice'&&linked?.options?.map(option=><label className="os-admin-field" key={option.id}>When “{option.label}”<input value={value.choices.find(c=>c.answer===option.id)?.value||''} onChange={event=>change({choices:linked.options!.map(o=>({answer:o.id,value:o.id===option.id?event.target.value:value.choices.find(c=>c.answer===o.id)?.value||''}))})}/></label>)}
  </fieldset>;
}
