import test from "node:test";
import assert from "node:assert/strict";
import {createLoopImprintRecipe,retainLoopImprintRecipe,validateLoopImprintRecipe} from "../app/os/home/imprint-loop-recipe.js";
import {personalImprintSamples,reorderSampleInput,correctedSampleInput} from "../app/os/home/imprint-personal-samples.js";
import {createLoopGeometry,loopPosition,sampleLoopStrand} from "../scripts/lib/imprint-loop-geometry.mjs";

test("loop recipes are repeatable, normalize ordering, exclude feeling and retain accepted forms",async()=>{
 for(const sample of personalImprintSamples){const input=sample.input,recipe=await createLoopImprintRecipe(input);assert.deepEqual(await createLoopImprintRecipe(input),recipe);assert.deepEqual(await createLoopImprintRecipe(reorderSampleInput(input)),recipe);assert.deepEqual(await createLoopImprintRecipe({...input,feeling:0,answers:{...input.answers,feeling:10}}),recipe);assert.equal(await retainLoopImprintRecipe(recipe,correctedSampleInput(input)),recipe);assert.notDeepEqual(await createLoopImprintRecipe(correctedSampleInput(input)),recipe);assert.deepEqual(validateLoopImprintRecipe(JSON.parse(JSON.stringify(recipe))),recipe);}
});
test("each filament meets itself in position, tangent and curvature without an end connector",async()=>{
 const recipe=await createLoopImprintRecipe(personalImprintSamples[0].input),h=1e-4;
 for(let i=0;i<recipe.filamentCount;i++){
  const u=i/recipe.filamentCount,a=loopPosition(recipe,0,u),b=loopPosition(recipe,1,u);assert.ok(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-7);
  for(const order of [1,2]){const derivative=t=>{const before=loopPosition(recipe,t-h,u),p=loopPosition(recipe,t,u),after=loopPosition(recipe,t+h,u);return p.map((v,k)=>order===1?(after[k]-before[k])/(2*h):(after[k]-2*v+before[k])/(h*h));};const d=derivative(0),e=derivative(1);assert.ok(Math.hypot(...d.map((v,k)=>v-e[k]))<(order===1?1e-4:.01));}
 }
});
test("the support is a closed surface with every edge shared twice; route samples lie on their course",async()=>{
 const recipe=await createLoopImprintRecipe(personalImprintSamples[1].input),geometry=createLoopGeometry(recipe,{steps:96}),edges=new Map();
 for(const triangle of geometry.surface.triangles)for(let i=0;i<3;i++){const a=triangle[i],b=triangle[(i+1)%3],key=a<b?`${a}:${b}`:`${b}:${a}`;edges.set(key,(edges.get(key)||0)+1);}
 assert.ok([...edges.values()].every(count=>count===2));
 for(const strand of geometry.strands){assert.equal(strand.closed,true);assert.equal(strand.ends.length,0);assert.deepEqual(strand.route[0],strand.route.at(-1));for(const j of [0,24,48,95]){const expected=sampleLoopStrand(geometry,strand,j/96);assert.ok(Math.hypot(...expected.map((v,k)=>v-strand.route[j][k]))<1e-7);}}
});
test("missing inputs and unknown or invalid construction versions fail visibly",async()=>{
 await assert.rejects(createLoopImprintRecipe({name:""}),/name/);const recipe=await createLoopImprintRecipe(personalImprintSamples[0].input);
 for(const invalid of [{...recipe,version:9},{...recipe,method:"other"},{...recipe,filamentCount:0},{...recipe,controls:[[NaN,1,1,1,1]]}])assert.throws(()=>validateLoopImprintRecipe(invalid));
 assert.equal(Object.isFrozen(recipe),true);assert.equal(Object.isFrozen(recipe.controls),true);assert.equal(JSON.stringify(recipe).includes(personalImprintSamples[0].input.birthday),false);
});
