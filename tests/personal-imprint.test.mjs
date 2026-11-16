import assert from "node:assert/strict";
import test from "node:test";
import { createImprintRecipe, createThreadRecipe, retainImprintRecipe, imprintSegments, imprintThreads } from "../app/os/home/imprint-model.js";
import { foldFilament, paintFoldScene } from "../app/os/home/imprint-folds.js";
const profile = { name: "Synthetic", birthday: "1990-01-01", answers: { habit: "Read", situation: "work" } };
test("recipes reproduce after serialization and answer-key reordering; exclude feeling", () => {
  const a = createImprintRecipe(profile);
  assert.deepEqual(createImprintRecipe({ ...profile, feeling: 0, answers: { situation: "work", habit: "Read" } }), a);
  assert.deepEqual(createImprintRecipe({ ...profile, answers: { ...profile.answers, feeling: 10 } }), a);
  assert.deepEqual(foldFilament(JSON.parse(JSON.stringify(a)), 12, 48), foldFilament(a, 12, 48));
});
test("accepted form survives profile corrections", () => {
  const original = createImprintRecipe(profile);
  assert.equal(retainImprintRecipe(original, { ...profile, name: "Changed", birthday: "2000-02-02" }), original);
  assert.notDeepEqual(createImprintRecipe({ ...profile, birthday: "2000-02-02" }), original);
});
test("sample variety, bounded coordinates, and six distinct color regions", () => {
  const forms = new Set();
  for (let i = 0; i < 100; i++) {
    const recipe = createImprintRecipe({ ...profile, name: `Synthetic ${i}` });
    forms.add(JSON.stringify(recipe));
    const filaments = Array.from({length:6},(_,index)=>foldFilament(recipe,Math.floor((index+.5)*recipe.filamentCount/6),48));
    assert.equal(new Set(filaments.map(s => s.area)).size, 6);
    for (const filament of filaments) for (const {x,y} of filament.points) assert.ok(x >= 0 && x <= 520 && y >= 0 && y <= 800);
  }
  assert.equal(forms.size, 100);
});
test("saved version-one recipes remain retained and renderable", () => {
  const original = { version: 1, phase: 1, bend: 2, turns: 1.7, spread: 90, twist: 3, fullness: 80 };
  assert.equal(retainImprintRecipe(original, profile), original);
  assert.deepEqual(imprintSegments(JSON.parse(JSON.stringify(original)), 12, 24), imprintSegments(original, 12, 24));
});
test("threads have continuous curve joins and distinct neighboring trajectories", () => {
  const bundles = imprintThreads(createThreadRecipe(profile));
  const flow = bundles.filter(bundle => !bundle.occlude);
  for (let section = 1; section < flow.length; section++) for (let line = 0; line < flow[section].threads.length; line++) {
    const previous = flow[section - 1].threads[line].points;
    const current = flow[section].threads[line].points;
    assert.deepEqual(previous.at(-1), current[0]);
    const a = [current[0][0] - previous.at(-2)[0], current[0][1] - previous.at(-2)[1]];
    const b = [current[1][0] - current[0][0], current[1][1] - current[0][1]];
    assert.ok(Math.abs(a[0] * b[1] - a[1] * b[0]) / (Math.hypot(...a) * Math.hypot(...b) || 1) < .35);
  }
  for (const bundle of bundles) {
    assert.equal(bundle.threads.length, 88);
    for (let line = 1; line < bundle.threads.length; line++) {
      assert.ok(bundle.threads[line].u > bundle.threads[line - 1].u);
      assert.notDeepEqual(bundle.threads[line].points, bundle.threads[line - 1].points);
    }
    for (const thread of bundle.threads) for (let i = 3; i < thread.points.length - 1; i += 3) {
      const [x, y] = thread.points[i];
      const a = [x - thread.points[i - 1][0], y - thread.points[i - 1][1]];
      const b = [thread.points[i + 1][0] - x, thread.points[i + 1][1] - y];
      // Both bounding paths have smooth joins; interpolation keeps them smooth
      // enough to avoid the old segmented-mesh appearance.
      const cross = Math.abs(a[0] * b[1] - a[1] * b[0]);
      assert.ok(cross / (Math.hypot(...a) * Math.hypot(...b) || 1) < .35);
    }
  }
});
test("dense filaments close smoothly without exposed ends; saved version-two paths survive", () => {
  const recipe = createImprintRecipe(profile);
  assert.ok(recipe.filamentCount >= 256);
  for(let index=0;index<recipe.filamentCount;index+=13){
    const filament=foldFilament(recipe,index,576), first=filament.points[0],last=filament.points.at(-1);
    assert.ok(Math.hypot(first.x-last.x,first.y-last.y,first.z-last.z)<1e-8);
    const a=filament.points[1], b=filament.points.at(-2);
    const before=[first.x-b.x,first.y-b.y,first.z-b.z],after=[a.x-first.x,a.y-first.y,a.z-first.z];
    const dot=before.reduce((sum,value,i)=>sum+value*after[i],0)/(Math.hypot(...before)*Math.hypot(...after));
    assert.ok(dot>.95);
  }
  const old=createThreadRecipe(profile);
  assert.equal(retainImprintRecipe(old,{...profile,name:"Changed"}),old);
  assert.deepEqual(imprintThreads(JSON.parse(JSON.stringify(old))),imprintThreads(old));
});
test("a filament keeps one hue through lighting changes without sample-joint bands", () => {
  let result;
  const context={ createImageData:(width,height)=>({data:new Uint8ClampedArray(width*height*4)}),putImageData:image=>{result=image.data;} };
  const scene={width:100,height:20,sx:1,sy:1,depth:new Float32Array(2000),filaments:[{
    area:"notes",accent:0,width:1,grain:1,points:[
      {x:10,y:10,z:0,light:.4,front:1},{x:50,y:10,z:0,light:.7,front:1},{x:90,y:10,z:0,light:1,front:1},
    ],
  }]};
  paintFoldScene(context,scene,{notes:1});
  const alpha=[];
  for(let x=12;x<88;x++){
    const at=(10*100+x)*4;
    assert.ok(result[at+3]>0);
    assert.ok(Math.abs(result[at]/result[at+1]-227/107)<.035);
    alpha.push(result[at+3]);
  }
  assert.ok(Math.max(...alpha)-Math.min(...alpha)<=1);
});
