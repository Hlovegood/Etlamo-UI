// Trusted local operator grants or removes review access on an existing account.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/database.mjs';
const [email,action='grant']=process.argv.slice(2);
if(!email || !['grant','revoke'].includes(action)) {console.error('Usage: node scripts/admin-access.mjs <registered-email> grant|revoke');process.exit(1);}
const root=fileURLToPath(new URL('../',import.meta.url));
const db=openDatabase(process.env.WEDDO_DB_PATH || resolve(root,'.data/weddo.sqlite'));
try {
  const result=db.prepare('UPDATE accounts SET is_admin=? WHERE email=?').run(action==='grant'?1:0,email.trim().toLowerCase());
  if(!result.changes) throw new Error('Register this email in Weddo first.');
  console.log(`Admin review access ${action==='grant'?'granted':'revoked'}. Refresh the account session to update navigation.`);
} finally {db.close();}
