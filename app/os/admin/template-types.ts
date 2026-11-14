import type { ChapterDraft } from './chapter-authoring.js';
import type { ChapterPage } from '../chapters/chapter-types';
import type { ContentImage } from './content-media';

export type TemplateValue = {
  source: 'fixed' | 'answer' | 'scale' | 'choice';
  value: string;
  answerKey: string;
  factor: number;
  offset: number;
  min: number;
  max: number;
  choices: Array<{ answer: string; value: string }>;
};
export type TemplatePage = ChapterPage & { purpose: 'content' | 'configuration' | 'reflection' | 'preview' };
export type TemplateItem = {
  id: string;
  kind: 'habit' | 'task' | 'non-negotiable' | 'negotiable';
  action: string;
  actionPattern?: string;
  cue: TemplateValue;
  target: TemplateValue;
  intensity: TemplateValue;
  unit: string;
  identity: string;
};
export type TemplateContent = {
  schemaVersion: 1;
  kind: 'routine' | 'protocol';
  title: string;
  description: string;
  cover?: ContentImage;
  pages: TemplatePage[];
  items: TemplateItem[];
};
export type TemplateDraft = ChapterDraft & { template: TemplateContent };
export type ResolvedTemplateItem = Omit<TemplateItem, 'cue' | 'target' | 'intensity'> & {cue:string;target:string;intensity:string};
