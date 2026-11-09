import { randomUUID } from 'node:crypto';
export function notify(db,accountId,kind,data={}) {
  db.prepare('INSERT INTO notifications (id,account_id,kind,data,created_at) VALUES (?,?,?,?,?)').run(randomUUID(),accountId,kind,JSON.stringify(data),new Date().toISOString());
}
export function notifyVenue(db,venueId,kind,data={},capability='edit') {
  const venue=db.prepare('SELECT owner FROM venue_submissions WHERE id=?').get(venueId);
  if(!venue)return;
  const permissions=capability==='reply'?['RESPONDER','BOTH']:['EDITOR','BOTH'];
  const staff=db.prepare('SELECT account_id FROM venue_team WHERE venue_id=? AND active=1 AND permission IN (?,?)').all(venueId,...permissions);
  for(const id of new Set([venue.owner,...staff.map(member=>member.account_id)]))notify(db,id,kind,data);
}
export function notificationView(row) {
  return {id:row.id,kind:row.kind,data:JSON.parse(row.data),createdAt:row.created_at,readAt:row.read_at};
}
export function pruneNotifications(db) {
  db.prepare('DELETE FROM notifications WHERE created_at<?').run(new Date(Date.now()-90*86400000).toISOString());
}
