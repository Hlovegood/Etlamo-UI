// Local review tool. Approval publishes the submitted snapshot immediately.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/database.mjs';
import { reviewVenue } from '../server/reviews.mjs';
const [id,decision]=process.argv.slice(2);
if(!id || !['approve','changes'].includes(decision)) {console.error('Usage: node scripts/review-venue.mjs <venue-id> approve|changes');process.exit(1);}
const root=fileURLToPath(new URL('../',import.meta.url));
const db=openDatabase(process.env.WEDDO_DB_PATH || resolve(root,'.data/weddo.sqlite'));
try {
  const row=db.prepare('SELECT * FROM venue_submissions WHERE id=?').get(id);
  if(!row || row.status!=='PENDING') throw new Error('A pending submission is required.');
  const result=reviewVenue(db,id,{decision:decision==='approve'?'APPROVED':'CHANGES',version:row.version,reason:'LISTING_DETAILS',note:''});
  if(result.error) throw new Error(result.error);
  console.log(`${id}: ${decision==='approve'?'approved and published':'changes requested'}. Refresh the browser catalog.`);
} finally {db.close();}
