import { notifyVenue } from './notifications.mjs';
import { transaction, reloadCatalog } from './database.mjs';

export const reviewReasons=['LISTING_DETAILS','PRICE_DETAILS','CAPACITY_DETAILS','CONTENT_DETAILS','OTHER'];
export function submissionView(db,row,includePublished=false) {
  const reviews=db.prepare('SELECT decision,reason,note,version,created_at FROM venue_review_history WHERE venue_id=? ORDER BY id DESC LIMIT 10').all(row.id);
  const result={...JSON.parse(row.data),id:row.id,status:row.status,version:row.version,createdAt:row.created_at,reviews:reviews.map(review=>({decision:review.decision,reason:review.reason,note:review.note,version:review.version,createdAt:review.created_at}))};
  if(includePublished) {
    const published=db.prepare('SELECT data FROM venues WHERE id=?').get(row.id);
    result.published=published?JSON.parse(published.data):null;
  }
  return result;
}
export function reviewVenue(db,id,input,reviewer=null) {
  if(!['APPROVED','CHANGES'].includes(input.decision) || !Number.isSafeInteger(input.version) || input.version<0 || typeof input.note!=='string' || input.note.trim().length>1000 || (input.decision==='CHANGES' && (!reviewReasons.includes(input.reason) || (input.reason==='OTHER' && !input.note.trim())))) return {error:'INVALID_REVIEW'};
  const result=transaction(db,()=>{
    const row=db.prepare('SELECT * FROM venue_submissions WHERE id=?').get(id);
    if(!row) return {error:'NOT_FOUND'};
    if(row.status!=='PENDING' || row.version!==input.version) return {error:'CONFLICT'};
    const data=JSON.parse(row.data);
    if(input.decision==='APPROVED')for(const item of db.prepare("SELECT data FROM requests WHERE json_extract(data,'$.venueId')=?").all(id)) {
      const request=JSON.parse(item.data),space=data.spaces.find(s=>s.id===request.spaceId);
      if(!space || space.capacity<request.guests || !data.packages.some(p=>p.id===request.packageId))return {error:'CAPACITY_CONFLICT'};
    }
    if(input.decision==='APPROVED') db.prepare('INSERT INTO venues (id,data) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(id,JSON.stringify({...data,id}));
    db.prepare('UPDATE venue_submissions SET status=?,version=version+1 WHERE id=? AND version=?').run(input.decision,id,input.version);
    db.prepare('INSERT INTO venue_review_history (venue_id,reviewer,decision,reason,note,version,created_at) VALUES (?,?,?,?,?,?,?)').run(id,reviewer,input.decision,input.decision==='CHANGES'?input.reason:null,input.note.trim(),input.version,new Date().toISOString());
    notifyVenue(db,id,input.decision==='APPROVED'?'VENUE_APPROVED':'VENUE_CHANGES',{venueId:id});
    return {venue:submissionView(db,db.prepare('SELECT * FROM venue_submissions WHERE id=?').get(id),true)};
  });
  if(!result.error && input.decision==='APPROVED') reloadCatalog(db);
  return result;
}
