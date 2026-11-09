import { DatabaseSync, backup } from 'node:sqlite';
import { existsSync, mkdirSync, chmodSync, linkSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

export async function copyDatabase(source,destination) {
  source=resolve(source);destination=resolve(destination);
  if(!existsSync(source) || existsSync(destination) || source===destination)throw new Error('The source must exist and the destination must be a new file. Existing databases are never overwritten.');
  mkdirSync(dirname(destination),{recursive:true,mode:0o700});
  const partial=`${destination}.partial-${randomUUID()}`;
  let db;
  try {
    db=new DatabaseSync(source,{readOnly:true});
    if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok' || !db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='requests'").get())throw new Error('Invalid Weddo database.');
    await backup(db,partial);db.close();db=null;
    chmodSync(partial,0o600);
    const check=new DatabaseSync(partial,{readOnly:true});
    try {if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Database verification failed.');}
    finally {check.close();}
    // A hard link publishes the completed copy atomically and refuses overwrite.
    try {
      linkSync(partial,destination);
    } catch(err) {
      if(err.code === 'EPERM' || err.code === 'EXDEV') {
        renameSync(partial,destination);
      } else {
        throw err;
      }
    }
    return destination;
  } finally {db?.close();rmSync(partial,{force:true});}
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=fileURLToPath(new URL('../',import.meta.url)),[mode,first,second]=process.argv.slice(2);
  try {
    if(!['backup','restore'].includes(mode) || (mode==='restore' && (!first || !second)))throw new Error('Use: backup [new-file.sqlite] OR restore <backup.sqlite> <new-file.sqlite>');
    const source=mode==='backup'?(process.env.WEDDO_DB_PATH || resolve(root,'.data/weddo.sqlite')):first;
    const destination=mode==='backup'?(first || resolve(root,'.data/backups',`weddo-${Date.now()}.sqlite`)):second;
    console.log(`Verified database copy: ${await copyDatabase(source,destination)}`);
    if(mode==='restore')console.log('Stop the current preview, then set WEDDO_DB_PATH to this restored file when starting Weddo.');
  } catch(error){console.error(error.message);process.exitCode=1;}
}
