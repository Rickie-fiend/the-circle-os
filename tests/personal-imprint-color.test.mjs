import test from 'node:test';import assert from 'node:assert/strict';
import {COLOR_GROUPS,COLOR_PRESETS,colorAreaWeight,bundleColorAmount,validateColorState} from '../app/os/home/imprint-color-model.js';
test('abstract areas are periodic, bounded, local and smoothly feathered',()=>{
 for(const group of COLOR_GROUPS){let zero=0,inside=0,peak=0,maxStep=0;
  for(let i=0;i<512;i++)for(let j=0;j<64;j++){const t=i/512,u=j/64,w=colorAreaWeight(group,t,u);assert.ok(w>=0&&w<=1);if(w===0)zero++;else inside++;peak=Math.max(peak,w);maxStep=Math.max(maxStep,Math.abs(w-colorAreaWeight(group,t+1/512,u)));assert.ok(Math.abs(w-colorAreaWeight(group,t+1,u))<1e-10);assert.ok(Math.abs(w-colorAreaWeight(group,t,u+1))<1e-10);}
  assert.ok(zero>inside&&inside>100&&peak>.9);assert.ok(maxStep<.07);
  // An entire strand is never colored: it enters and leaves the area.
  for(const u of [.25,.4,.55])assert.ok(Array.from({length:512},(_,i)=>colorAreaWeight(group,i/512,u)).some(v=>v===0));
 }
});
test('zero reset, illustrative fading and independent group controls repeat',()=>{
 for(const state of Object.values(COLOR_PRESETS))validateColorState(state);
 for(let j=0;j<256;j++){const t=j/256,u=.4;assert.equal(bundleColorAmount({},t,u),0);assert.ok(bundleColorAmount(COLOR_PRESETS.older,t,u)<=bundleColorAmount(COLOR_PRESETS.mixed,t,u));assert.equal(bundleColorAmount({notes:.5},t,u),.5*colorAreaWeight('notes',t,u));}
 for(const state of [{bad:1},{notes:NaN},{notes:2},null])assert.throws(()=>validateColorState(state));
});
