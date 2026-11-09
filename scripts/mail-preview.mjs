// Trusted local operator can retrieve an unexpired recovery link when the user is signed out.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/database.mjs';
import { ownMailPreview } from '../server/account-security.mjs';
const [email]=process.argv.slice(2);
if(!email){console.error('Usage: node scripts/mail-preview.mjs <registered-email>');process.exit(1);}
const root=fileURLToPath(new URL('../',import.meta.url));
const db=openDatabase(process.env.WEDDO_DB_PATH || resolve(root,'.data/weddo.sqlite'));
try {
  const account=db.prepare('SELECT id FROM accounts WHERE email=?').get(email.trim().toLowerCase());
  if(!account)throw new Error('Account not found.');
  for(const mail of ownMailPreview(db,account))console.log(`${mail.purpose} (expires ${new Date(mail.expires).toISOString()}): ${mail.url}`);
} finally {db.close();}
