import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSoriGeometry} from '../scripts/lib/imprint-sori-geometry.mjs';
import {createSoriReliefGeometry,sampleSoriReliefStrand,reliefHeight} from '../scripts/lib/imprint-sori-relief.mjs';
import {inspectLoopGeometry} from '../scripts/lib/imprint-loop-inspection.mjs';

test('Sori relief varies in both directions with smooth periodic seams',()=>{
 const range=a=>Math.max(...a)-Math.min(...a),h=1e-4;
 for(const t of [.08,.21,.43,.67,.86])assert.ok(range(Array.from({length:65},(_,i)=>reliefHeight(t,i/128)))>.15);
 for(const u of [.12,.24,.36]){
  assert.ok(range(Array.from({length:128},(_,i)=>reliefHeight(i/128,u)))>.15);
  assert.ok(Math.abs(reliefHeight(0,u)-reliefHeight(1,u))<1e-8);
  const derivative=t=>(reliefHeight(t+h,u)-reliefHeight(t-h,u))/(2*h);
  assert.ok(Math.abs(derivative(0)-derivative(1))<1e-5);
 }
 for(const t of [0,.31,.72])assert.ok(Math.abs(reliefHeight(t,0)-reliefHeight(t,1))<1e-8);
 for(let j=0;j<32;j++)for(let i=1;i<128;i++){
  const u=i/128,sine=Math.sin(2*Math.PI*u);
  if(Math.abs(sine)>1e-8)assert.ok(1+reliefHeight(j/32,u)/sine>=.2-1e-8);
 }
});

test('actual relieved strands preserve the accepted course and stay closed and separated',async()=>{
 const original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8')),saved=JSON.stringify(original),before=createSoriGeometry(original,3072),after=createSoriReliefGeometry(original,3072),checked=inspectLoopGeometry(after,{sampleStrand:sampleSoriReliefStrand});
 assert.equal(JSON.stringify(original),saved);assert.ok(Object.values(checked.gates).every(Boolean),JSON.stringify(checked.inspection));
 assert.equal(after.strands.length,128);assert.deepEqual(after.recipe,before.recipe);let changed=0;
 for(let i=0;i<128;i++){
  const strand=after.strands[i];assert.deepEqual(strand.route[0],strand.route.at(-1));assert.equal(strand.ends.length,0);
  assert.equal(strand.width,before.strands[i].width);assert.equal(strand.reflectance,before.strands[i].reflectance);
  for(let j=0;j<after.steps;j++){
   if(Math.abs(strand.route[j][2]-before.strands[i].route[j][2])>.1)changed++;
   if(j%256===0){const point=sampleSoriReliefStrand(after,strand,j/after.steps);assert.ok(Math.hypot(...point.map((v,k)=>v-strand.route[j][k]))<1e-7);}
  }
 }
 assert.ok(changed>10000);
});
