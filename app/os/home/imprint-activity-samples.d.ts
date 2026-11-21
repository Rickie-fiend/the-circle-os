import type {ActivityAction,ActivityState} from './imprint-activity-model.js';
export function studyNow():string;
export function sampleAction(kind:string,source:string,at?:string,owner?:string,extras?:Partial<ActivityAction>):ActivityAction;
export function activitySample():ActivityState;
