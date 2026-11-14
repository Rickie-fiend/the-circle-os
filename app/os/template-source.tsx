"use client";

import type { ResolvedTemplateItem } from './admin/template-types';
import { routineTemplateCue } from './admin/template-model.js';
import type { RoutineSchedule } from './routine-schedule-control';
import { useState } from 'react';

export type TemplateSourceSnapshot = {
  id: string; version: number; operationId: string; adoptedAt: string; title: string;
  items: ResolvedTemplateItem[];
  answers: Array<{pageId:string;answerKey:string;question:string;purpose:string;value:unknown;displaySnapshot?:string;answeredAt:string}>;
  records?: Array<{id:string;kind:string}>;
  schedule?: RoutineSchedule;
  updatedAt?: string;
};

export function TemplateSource({source}:{source?:unknown}) {
  const [open,setOpen]=useState(false);
  if (!source || typeof source !== 'object' || !('id' in source) || !('version' in source)) return null;
  const snapshot = source as TemplateSourceSnapshot;
  return <details className="os-template-source" onToggle={event=>setOpen(event.currentTarget.open)}>
    <summary aria-label={`Template source: ${snapshot.title}`}><span className="os-template-source-mark" aria-hidden="true" /></summary>
    {open && <div className="os-template-source-copy">
      <p className="os-record-text">{snapshot.title}</p><p className="os-record-cue">Version {snapshot.version}</p>
      {snapshot.items.map(item=><div key={item.id}><p className="os-record-text">{item.action}</p>{routineTemplateCue(item)&&<p className="os-record-cue">{routineTemplateCue(item)}</p>}{item.identity&&<p className="os-record-cue">{item.identity}</p>}</div>)}
      {snapshot.answers.length ? <dl>{snapshot.answers.map(answer=><div key={answer.answerKey}><dt>{answer.question}</dt><dd>{answer.displaySnapshot ?? (Array.isArray(answer.value)?answer.value.join(', '):String(answer.value))}</dd></div>)}</dl> : null}
      <a href={`/os/catalog/read?id=${encodeURIComponent(snapshot.id)}&version=${snapshot.version}`}>Open original template</a>
    </div>}
  </details>;
}
