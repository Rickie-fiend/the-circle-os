import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createSoriGeometry} from '../scripts/lib/imprint-sori-geometry.mjs';
import {inspectLoopGeometry} from '../scripts/lib/imprint-loop-inspection.mjs';
test('Sori revision preserves the original recipe and constructs one smooth end-free composition',async()=>{
 const original=JSON.parse(await readFile('docs/design/personal-imprint-loops-v2-sori-recipe.json','utf8')),before=JSON.stringify(original),geometry=createSoriGeometry(original,3072),inspection=inspectLoopGeometry(geometry);
 assert.equal(JSON.stringify(original),before);
 assert.equal(geometry.strands.length,128);
 assert.notDeepEqual(geometry.recipe.controls,original.controls);
 assert.ok(Object.values(inspection.gates).every(Boolean),JSON.stringify(inspection.inspection));
 assert.ok(inspection.inspection.majorHoles<=3);
 for(const strand of geometry.strands){assert.equal(strand.ends.length,0);assert.deepEqual(strand.route[0],strand.route.at(-1));}
});
