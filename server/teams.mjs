import { notify } from './notifications.mjs';
import { randomUUID } from 'node:crypto';
import { transaction } from './database.mjs';
export const teamPermissions=['EDITOR','RESPONDER','BOTH'];
export function venueAccess(db,venueId,accountId) {
  const venue=db.prepare('SELECT owner FROM venue_submissions WHERE id=?').get(venueId);
  if(!venue)return null;
  if(venue.owner===accountId)return {isOwner:true,canEdit:true,canReply:true,canManageTeam:true};
  const member=db.prepare('SELECT permission FROM venue_team WHERE venue_id=? AND account_id=? AND active=1').get(venueId,accountId);
  return member?{isOwner:false,canEdit:['EDITOR','BOTH'].includes(member.permission),canReply:['RESPONDER','BOTH'].includes(member.permission),canManageTeam:false}:null;
}
export function teamMembers(db,venueId) {
  return db.prepare('SELECT t.id,a.email,t.permission,t.version FROM venue_team t JOIN accounts a ON a.id=t.account_id WHERE t.venue_id=? AND t.active=1 ORDER BY t.created_at,t.id').all(venueId);
}
export function changeTeam(db,venueId,actor,input,memberId=null) {
  return transaction(db,()=>{
    if(!venueAccess(db,venueId,actor)?.canManageTeam)return {error:'NOT_FOUND'};
    if(memberId) {
      if(!['update','remove'].includes(input.action) || !Number.isSafeInteger(input.version) || input.version<0 || (input.action==='update' && !teamPermissions.includes(input.permission)))return {error:'INVALID_TEAM'};
      const member=db.prepare('SELECT * FROM venue_team WHERE id=? AND venue_id=? AND active=1').get(memberId,venueId);
      if(!member)return {error:'NOT_FOUND'};
      if(member.version!==input.version)return {error:'CONFLICT'};
      const permission=input.action==='remove'?member.permission:input.permission;
      db.prepare('UPDATE venue_team SET permission=?,active=?,version=version+1 WHERE id=? AND version=?').run(permission,input.action==='remove'?0:1,memberId,input.version);
      db.prepare('INSERT INTO venue_team_history (member_id,actor,action,permission,created_at) VALUES (?,?,?,?,?)').run(memberId,actor,input.action,permission,new Date().toISOString());
      notify(db,member.account_id,input.action==='remove'?'TEAM_REMOVED':'TEAM_UPDATED',{venueId});
    } else {
      const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
      if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !teamPermissions.includes(input.permission))return {error:'INVALID_TEAM'};
      const account=db.prepare("SELECT id FROM accounts WHERE email=? AND role='vendor'").get(email);
      if(!account || account.id===actor)return {error:'MEMBER_UNAVAILABLE'};
      const previous=db.prepare('SELECT * FROM venue_team WHERE venue_id=? AND account_id=?').get(venueId,account.id);
      if(previous?.active)return {error:'MEMBER_EXISTS'};
      if(db.prepare('SELECT count(*) AS n FROM venue_team WHERE venue_id=? AND active=1').get(venueId).n>=25)return {error:'TEAM_FULL'};
      const id=previous?.id || randomUUID();
      if(previous)db.prepare('UPDATE venue_team SET permission=?,active=1,version=version+1 WHERE id=?').run(input.permission,id);
      else db.prepare('INSERT INTO venue_team (id,venue_id,account_id,permission,created_at) VALUES (?,?,?,?,?)').run(id,venueId,account.id,input.permission,new Date().toISOString());
      db.prepare('INSERT INTO venue_team_history (member_id,actor,action,permission,created_at) VALUES (?,?,?,?,?)').run(id,actor,'add',input.permission,new Date().toISOString());
      notify(db,account.id,'TEAM_ADDED',{venueId});
    }
    return {members:teamMembers(db,venueId)};
  });
}
