import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("reference-traced master contains independent editable geometry and no raster",async()=>{
  const svg=await readFile("docs/design/personal-imprint-thread-master-v1.svg","utf8");
  assert.match(svg,/viewBox="0 0 1024 1536"/);
  assert.ok([...svg.matchAll(/id="thread-\d+"/g)].length>500);
  assert.doesNotMatch(svg,/<image|base64|https?:\/\/(?!www\.w3\.org)/);
  assert.doesNotMatch(svg,/<script|<foreignObject/);
  const gradients=[...svg.matchAll(/id="(light-[\d-]+)"/g)].map(match=>match[1]);
  assert.equal(new Set(gradients).size,gradients.length);
  const ids=new Set(gradients);
  for(const match of svg.matchAll(/stroke="url\(#([\d\w-]+)\)"/g))assert.ok(ids.has(match[1]));
});
