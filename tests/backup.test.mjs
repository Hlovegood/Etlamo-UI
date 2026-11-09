import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { copyDatabase } from '../scripts/database.mjs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '../server/database.mjs';

test('backup captures active WAL data and restore never overwrites a database',async()=>{
  const directory=mkdtempSync(join(tmpdir(),'weddo-backup-')),source=join(directory,'source.sqlite'),saved=join(directory,'backup.sqlite'),restored=join(directory,'restored.sqlite');
  const db=openDatabase(source);
  try {
    db.prepare("INSERT INTO sessions (id,csrf,expires) VALUES ('test-owner','csrf',1)").run();
    await copyDatabase(source,saved);
    await copyDatabase(saved,restored);
    const copy=new DatabaseSync(restored,{readOnly:true});
    try {assert.ok(copy.prepare("SELECT id FROM sessions WHERE id='test-owner'").get());assert.equal(copy.prepare('PRAGMA integrity_check').get().integrity_check,'ok');}
    finally {copy.close();}
    assert.equal(statSync(saved).mode&0o777,process.platform==='win32'?0o666:0o600);
    await assert.rejects(()=>copyDatabase(saved,source),/never overwritten/);
    assert.ok(db.prepare("SELECT id FROM sessions WHERE id='test-owner'").get());
  } finally {db.close();rmSync(directory,{recursive:true,force:true});}
});
