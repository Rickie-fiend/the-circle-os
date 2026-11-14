import type { ReactNode } from 'react';
import { PageLayout } from './app-session';
import { RoutineHeaderButton } from './routine-controls';
import type { ChapterDefinition } from './chapters/chapter-types';
import { createChapterRun } from './chapters/chapter-model.js';

export function RoutinePreviewPage({children,onBack,footer}:{children:ReactNode;onBack:()=>void;footer?:ReactNode}) {
  return <PageLayout className="os-habit-page" variant="app" placement="content-flow" theme="dark" headerLeft={<RoutineHeaderButton className="os-card-label" onClick={onBack}>Back</RoutineHeaderButton>} headerRight={<span className="os-card-label">Record</span>} footer={footer}><div className="os-page-main">{children}</div></PageLayout>;
}
export function RoutineBody({children}:{children:ReactNode}) { return <div className="os-routine-body">{children}</div>; }
export function RoutineItemCopy({action,cue,identity,children}:{action?:string;cue?:string;identity?:string;children?:ReactNode}) {
  return <div className="os-habit-action-copy">{children || <><p className="os-record-text">{action}</p>{cue&&<p className="os-record-cue">{cue}</p>}{identity&&<p className="os-record-cue">{identity}</p>}</>}</div>;
}
/** Transient frame for the shared player; it is not a saved Habit Building run. */
export function routineFrame() {
  const definition: ChapterDefinition = {
    schemaVersion: 1,
    id: 'routine-surface',
    version: 1,
    status: 'published',
    session: 'habit',
    theme: 'dark',
    title: '',
    purpose: 'Routine surface',
    estimatedMinutes: 1,
    pages: [{ id: 'end', type: 'result' }, { id: 'routine', type: 'idle' }],
  };
  return {
    definition,
    run: {
      ...createChapterRun(definition),
      currentPageId: 'routine',
      furthestPageId: 'routine',
      status: 'completed' as const,
    },
  };
}
