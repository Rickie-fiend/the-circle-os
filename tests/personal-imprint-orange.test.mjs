import test from 'node:test';import assert from 'node:assert/strict';
import {paintOrangePixel,FRESH_ORANGE,FADED_ORANGE,growthPaint} from '../app/os/home/imprint-growth-model.js';
test('fresh and faded Orange stay distinct and visible on lit strands',()=>{
 for(const base of [45,65,100,150,220]){
  const bone=[base,base*.99,base*.96],fresh=paintOrangePixel(bone,1,FRESH_ORANGE),faded=paintOrangePixel(bone,1,FADED_ORANGE);
  assert.ok(faded[0]>=75,'lit faded Orange red remains at least three times Ink red');assert.ok(faded[0]>faded[1]*1.7,'faded remains Orange');
  assert.ok(fresh[0]-faded[0]>=25,'fresh and faded visibly separated in the core');
  assert.ok(fresh.every((v,i)=>v>=faded[i]));assert.ok(fresh.every(v=>v>=0&&v<255));
 }
});
test('zero color preserves Bone and feathering approaches the edge continuously',()=>{
 const bone=[65,64,61];assert.deepEqual(paintOrangePixel(bone,0,1),bone);assert.deepEqual(paintOrangePixel(bone,1,0),bone);
 assert.deepEqual(paintOrangePixel(bone,1e-6,1),bone);
 const dark=paintOrangePixel([20,20,19],1,1),light=paintOrangePixel([100,99,96],1,1);assert.ok(light.every((v,i)=>v>dark[i]));
 assert.deepEqual(growthPaint({}, {},.5,.5),{weight:0,brightness:0});
});
