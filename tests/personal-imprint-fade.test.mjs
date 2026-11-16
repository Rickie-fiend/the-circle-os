import test from 'node:test';import assert from 'node:assert/strict';
import {colorFadeAt,colorBrightnessAt,fictionalUse,usageState,FRESH_ORANGE,FADED_ORANGE} from '../app/os/home/imprint-growth-model.js';
// Construct local wall times so the test verifies the same local 06:00 rule
// independently of the test computer's zone. No real records are involved.
test('24-hour wait followed by local 06:00, including exact cutoff and rollover',()=>{
 const cases=[[[2026,10,16,21,0],[2026,10,18,6,0]],[[2026,10,17,5,30],[2026,10,18,6,0]],[[2026,10,17,6,0],[2026,10,18,6,0]],[[2026,10,17,6,1],[2026,10,19,6,0]],[[2026,11,31,21,0],[2027,0,2,6,0]]];
 for(const [input,expected] of cases){const applied=new Date(...input),cutoff=colorFadeAt(applied);assert.equal(cutoff.getTime(),new Date(...expected).getTime());assert.ok(cutoff-applied>=24*60*60*1000);assert.equal(colorBrightnessAt(applied,new Date(+cutoff-1)),FRESH_ORANGE);assert.equal(colorBrightnessAt(applied,cutoff),FADED_ORANGE);assert.equal(colorBrightnessAt(applied,new Date(+cutoff+40*86400000)),FADED_ORANGE);assert.equal(colorBrightnessAt(applied,new Date(+applied-1)),0);}
 assert.throws(()=>colorFadeAt('invalid'));assert.throws(()=>colorFadeAt(null));assert.throws(()=>colorBrightnessAt(new Date(),'invalid'));assert.throws(()=>colorBrightnessAt(new Date(),null));
});
test('later use gets a fresh cycle; inactivity changes brightness once and preserves spread',()=>{
 const applied=new Date(2026,10,16,21),later=new Date(2026,10,19,21);
 assert.equal(colorBrightnessAt(applied,later),FADED_ORANGE);assert.equal(colorBrightnessAt(later,later),FRESH_ORANGE);
 const e=fictionalUse(),one=usageState(e,91);assert.deepEqual(usageState(e,92),one);assert.deepEqual(usageState(e,120),one);
 for(const g of Object.keys(one))assert.equal(one[g].spread,usageState(e,90)[g].spread);
});
