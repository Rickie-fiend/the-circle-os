import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';

test('hosted template runner refuses implicit writes before reading hosted configuration',()=>{
  const result=spawnSync(process.execPath,['scripts/check-content-admin-live.mjs','--app','--catalog','--templates'],{encoding:'utf8',env:{}});
  assert.equal(result.status,1);assert.match(result.stderr,/Use --write only after hosted verification approval/);assert.equal(result.stdout,'');
});

test('template acceptance requires its complete production HTTP and catalog path',()=>{
  const result=spawnSync(process.execPath,['scripts/check-content-admin-live.mjs','--write','--templates'],{encoding:'utf8',env:{}});
  assert.equal(result.status,1);assert.match(result.stderr,/Template acceptance requires --app --catalog/);assert.equal(result.stdout,'');
});
