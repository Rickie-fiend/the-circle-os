import test from "node:test";
import assert from "node:assert/strict";
import {createPersonalImprintRecipe,retainPersonalImprintRecipe,validatePersonalImprintRecipe,ImprintInputError,PERSONAL_IMPRINT_LIMITS} from "../app/os/home/imprint-personal-recipe.js";
import {personalImprintSamples,reorderSampleInput,correctedSampleInput} from "../app/os/home/imprint-personal-samples.js";
const sample=personalImprintSamples[1].input,clone=()=>structuredClone(sample);

test("same answers, harmless formatting and reordered selections retain the same initial form",async()=>{
 const original=await createPersonalImprintRecipe(sample),changed=reorderSampleInput(sample);
 changed.name="  ARUN  ";changed.answers.pastEffort.items[0].description=changed.answers.pastEffort.items[0].description.toUpperCase();
 changed.answers.habit.wording="  Read    one page ";changed.answers.situations.push(changed.answers.situations[0]);
 assert.deepEqual(await createPersonalImprintRecipe(changed),original);
 assert.deepEqual(await createPersonalImprintRecipe(sample),original);
});

test("every approved input participates in initial generation",async t=>{
 const baseline=await createPersonalImprintRecipe(sample);
 const edits={name:v=>v.name="Another name",birthday:v=>v.birthday="1989-11-07",situations:v=>v.answers.situations.push("studying"),lifeNow:v=>v.answers.lifeNow="starting-again",experienceCategory:v=>v.answers.pastEffort.items[0].category="work",experienceDescription:v=>v.answers.pastEffort.items[0].description="Learning another thing",experienceStatus:v=>v.answers.pastEffort.items[0].status="stopped",wantedChoice:v=>v.answers.wantedChanges[1].choice="health",wantedDetail:v=>v.answers.wantedChanges[0].detail="Drawing animals",focus:v=>v.answers.primaryFocus="relationships",wake:v=>v.answers.wake="07:00",bed:v=>v.answers.bed="23:00",habitKind:v=>v.answers.habit.kind="start",habitWording:v=>v.answers.habit.wording="Read two pages",cueChoice:v=>v.answers.habit.cue.choice="another-time",cueDetail:v=>v.answers.habit.cue.detail="After dinner"};
 for(const[name,edit]of Object.entries(edits))await t.test(name,async()=>{const input=clone();edit(input);assert.notDeepEqual(await createPersonalImprintRecipe(input),baseline);});
});

test("feeling, account fields, activity and unreviewed keys do not alter generation",async()=>{
 const input=clone();input.feeling=0;input.accountId="fictional-account";input.email="fictional@example.invalid";input.answers.feeling=10;input.answers.activity={notes:99};input.answers.unknown="ignore";
 assert.deepEqual(await createPersonalImprintRecipe(input),await createPersonalImprintRecipe(sample));
});

test("retaining a recipe ignores subsequent corrections and incomplete replacement input",async()=>{
 const recipe=await createPersonalImprintRecipe(sample);
 assert.equal(await retainPersonalImprintRecipe(recipe,correctedSampleInput(sample)),recipe);
 assert.equal(await retainPersonalImprintRecipe(recipe,{}),recipe);
 assert.notDeepEqual(await createPersonalImprintRecipe(correctedSampleInput(sample)),recipe);
 assert.deepEqual(await retainPersonalImprintRecipe(null,sample),recipe);
});

test("uncertain answers produce a full bounded recipe without invented evidence",async()=>{
 const input=structuredClone(personalImprintSamples[0].input),before=structuredClone(input),recipe=await createPersonalImprintRecipe(input);
 assert.deepEqual(input,before);validatePersonalImprintRecipe(recipe);
 assert.equal(Object.keys(recipe.parameters).length,Object.keys(PERSONAL_IMPRINT_LIMITS).length);
});

test("missing inputs, invalid dates/times and mismatched focus are reported before generation",async t=>{
 const edits=[v=>v.name=" ",v=>v.birthday="2023-02-29",v=>v.birthday="0000-01-01",v=>v.answers.wake="24:00",v=>v.answers.bed="12:60",v=>v.answers.habit.wording="",v=>v.answers.primaryFocus="not-selected",v=>v.answers.pastEffort.items=[],v=>v.answers.pastEffort.kind="nothing-comes-to-mind"];
 for(const[index,edit]of edits.entries())await t.test(String(index),async()=>{const input=clone();edit(input);await assert.rejects(createPersonalImprintRecipe(input),ImprintInputError);});
 const leap=clone();leap.birthday="2000-02-29";await createPersonalImprintRecipe(leap);
});

test("recipes round-trip as numeric controls, remain frozen and reject unsafe versions or limits",async()=>{
 const recipe=await createPersonalImprintRecipe(sample),parsed=JSON.parse(JSON.stringify(recipe));
 assert.deepEqual(validatePersonalImprintRecipe(parsed),recipe);
 assert.equal(Object.isFrozen(recipe),true);assert.equal(Object.isFrozen(recipe.parameters),true);
 assert.equal(JSON.stringify(recipe).includes(sample.name),false);assert.equal(JSON.stringify(recipe).includes(sample.birthday),false);
 for(const[key,limit]of Object.entries(PERSONAL_IMPRINT_LIMITS))assert.ok(Math.abs(recipe.parameters[key])<=limit);
 for(const value of [{...parsed,version:2},{...parsed,baseGeometryHash:"other"},{...parsed,name:"unreviewed"},{...parsed,parameters:{...parsed.parameters,width:.5}},{...parsed,parameters:{...parsed.parameters,depth:NaN}}])assert.throws(()=>validatePersonalImprintRecipe(value));
});
