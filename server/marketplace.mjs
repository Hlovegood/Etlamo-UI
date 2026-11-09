import { randomUUID } from 'node:crypto';
import { venues, sessions } from '../src/data.js';
import { validDate, today } from '../src/domain.js';
import { venueAccess } from './teams.mjs';
import { transaction } from './database.mjs';
import { notify, notifyVenue } from './notifications.mjs';

export const availabilityFor=(db,id)=>db.prepare('SELECT space_id AS spaceId,date,session,blocked,reason,version,updated_at AS updatedAt FROM availability WHERE venue_id=? AND date>=? ORDER BY date,space_id,session LIMIT 2000').all(id,today());
export const isBlocked=(db,details)=>db.prepare('SELECT blocked FROM availability WHERE venue_id=? AND space_id=? AND date=? AND session=?').get(details.venueId,details.spaceId,details.date,details.session)?.blocked===1;

export function mediaRecord(db,id,account) {
  const row=db.prepare('SELECT * FROM venue_media WHERE id=?').get(id);
  if(!row)return null;
  const published=db.prepare('SELECT data FROM venues WHERE id=?').get(row.venue_id);
  if(!JSON.parse(published?.data || '{}').media?.includes(id) && !account?.is_admin && !venueAccess(db,row.venue_id,account?.id || '')?.canEdit)return null;
  return row;
}

export async function uploadPhoto(db,req,venueId,ErrorType) {
  // ponytail: SQLite holds up to 40 photos per venue; use managed object storage for a public launch.
  const count=db.prepare('SELECT count(*) AS n FROM venue_media WHERE venue_id=?').get(venueId).n;
  if(count>=40)throw new ErrorType(422,'MEDIA_LIMIT','This venue has reached its upload limit.');
  const {type,bytes}=await readPhotoBytes(req,ErrorType);
  const id=randomUUID();
  db.prepare('INSERT INTO venue_media (id,venue_id,type,bytes,created_at) VALUES (?,?,?,?,?)').run(id,venueId,type,bytes,new Date().toISOString());
  return {id};
}

export async function readPhotoBytes(req,ErrorType) {
  const type=req.headers['content-type'];
  if(!['image/jpeg','image/png','image/webp'].includes(type))throw new ErrorType(422,'INVALID_PHOTO','Choose a JPEG, PNG or WebP image.');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)throw new ErrorType(413,'INVALID_PHOTO','Choose an image smaller than 5 MB.');chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);
  const valid=bytes.length>=24 && (type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR':type==='image/jpeg'?bytes[0]===255 && bytes[1]===216 && bytes[2]===255 && bytes.at(-2)===255 && bytes.at(-1)===217:bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP' && bytes.readUInt32LE(4)===bytes.length-8);
  if(!valid)throw new ErrorType(422,'INVALID_PHOTO','The image format does not match its content.');
  return {type,bytes};
}

function inquiryAccess(db,id,owner,account) {
  const row=db.prepare('SELECT * FROM requests WHERE id=?').get(id);
  if(!row || row.status==='DRAFT')return null;
  const venueId=JSON.parse(row.data).venueId;
  if(row.owner===owner.id)return {row,venueId,kind:'CUSTOMER',sender:`customer:${owner.id}`};
  if(account && venueAccess(db,venueId,account.id)?.canReply)return {row,venueId,kind:'VENDOR',sender:`vendor:${account.id}`};
  return null;
}

export async function marketplaceApi(db,req,res,url,ctx) {
  const {account,owner,body,ErrorType:E,json,pagination,page}=ctx,path=url.pathname;
  const fail=(status,code,message)=>{throw new E(status,code,message);};
  if(path==='/api/favorites') {
    if(!account)fail(401,'ACCOUNT_REQUIRED','Sign in to save venues to your account.');
    if(req.method==='POST') {
      const input=await body(req);
      if(typeof input.saved!=='boolean' || !venues.some(v=>v.id===input.venueId))fail(422,'INVALID_SELECTION','Choose a published venue.');
      if(input.saved)db.prepare('INSERT OR IGNORE INTO favorites (account_id,venue_id) VALUES (?,?)').run(account.id,input.venueId);
      else db.prepare('DELETE FROM favorites WHERE account_id=? AND venue_id=?').run(account.id,input.venueId);
    } else if(req.method!=='GET')return false;
    json(res,200,{ids:db.prepare('SELECT venue_id FROM favorites WHERE account_id=? ORDER BY rowid').all(account.id).map(row=>row.venue_id)});return true;
  }
  const upload=path.match(/^\/api\/vendor\/venues\/([a-z0-9-]{1,80})\/photos$/);
  if(upload && req.method==='POST') {
    if(!account || !venueAccess(db,upload[1],account.id)?.canEdit)fail(404,'NOT_FOUND','Venue not found.');
    json(res,201,await uploadPhoto(db,req,upload[1],E));return true;
  }
  const calendar=path.match(/^\/api\/vendor\/venues\/([a-z0-9-]{1,80})\/availability$/);
  if(calendar) {
    const id=calendar[1];
    if(!account || !venueAccess(db,id,account.id)?.canEdit)fail(404,'NOT_FOUND','Venue not found.');
    if(req.method==='POST') {
      const input=await body(req),venue=JSON.parse(db.prepare('SELECT data FROM venue_submissions WHERE id=?').get(id).data);
      if(!venue.spaces.some(s=>s.id===input.spaceId) || !validDate(input.date) || input.date>`${Number(today().slice(0,4))+3}-12-31` || !sessions.includes(input.session) || typeof input.blocked!=='boolean' || !['PRIVATE_EVENT','MAINTENANCE','BOOKED_ELSEWHERE'].includes(input.reason) || !Number.isSafeInteger(input.version) || input.version<0)fail(422,'INVALID_AVAILABILITY','Choose a space, date, session and reason.');
      transaction(db,()=>{
        const old=db.prepare('SELECT version FROM availability WHERE venue_id=? AND space_id=? AND date=? AND session=?').get(id,input.spaceId,input.date,input.session);
        if((old?.version || 0)!==input.version)fail(409,'CONFLICT','Refresh the calendar before saving.');
        if(!old && db.prepare('SELECT count(*) AS n FROM availability WHERE venue_id=? AND date>=?').get(id,today()).n>=2000)fail(422,'CALENDAR_LIMIT','Update an existing date before adding more dates.');
        const now=new Date().toISOString();
        db.prepare('INSERT INTO availability (venue_id,space_id,date,session,blocked,reason,version,updated_at) VALUES (?,?,?,?,?,?,1,?) ON CONFLICT(venue_id,space_id,date,session) DO UPDATE SET blocked=excluded.blocked,reason=excluded.reason,version=availability.version+1,updated_at=excluded.updated_at').run(id,input.spaceId,input.date,input.session,Number(input.blocked),input.reason,now);
        db.prepare('INSERT INTO availability_history (venue_id,space_id,date,session,blocked,reason,actor,created_at) VALUES (?,?,?,?,?,?,?,?)').run(id,input.spaceId,input.date,input.session,Number(input.blocked),input.reason,account.id,now);
      });
    } else if(req.method!=='GET')return false;
    json(res,200,{items:availabilityFor(db,id)});return true;
  }
  const thread=path.match(/^\/api\/requests\/([a-f0-9-]{36})\/(messages|history)$/);
  if(thread) {
    const access=inquiryAccess(db,thread[1],owner,account);
    if(!access)fail(404,'NOT_FOUND','Inquiry not found.');
    if(thread[2]==='history' && req.method==='GET') {
      json(res,200,{items:db.prepare('SELECT status,created_at AS createdAt FROM request_history WHERE request_id=? ORDER BY id').all(thread[1])});return true;
    }
    if(thread[2]!=='messages')return false;
    if(req.method==='POST') {
      const input=await body(req);
      if(typeof input.text!=='string' || !input.text.trim() || input.text.trim().length>1000 || typeof input.nonce!=='string' || !/^[a-f0-9-]{36}$/.test(input.nonce))fail(422,'INVALID_MESSAGE','Write a message of 1–1000 characters.');
      transaction(db,()=>{
        if(!db.prepare('SELECT id FROM inquiry_messages WHERE request_id=? AND sender=? AND nonce=?').get(thread[1],access.sender,input.nonce) && db.prepare('SELECT count(*) AS n FROM inquiry_messages WHERE request_id=?').get(thread[1]).n>=200)fail(422,'MESSAGE_LIMIT','This conversation has reached its limit. Contact support.');
        const result=db.prepare('INSERT OR IGNORE INTO inquiry_messages (id,request_id,sender,kind,text,nonce,created_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(),thread[1],access.sender,access.kind,input.text.trim(),input.nonce,new Date().toISOString());
        if(result.changes) {
          if(access.kind==='CUSTOMER')notifyVenue(db,access.venueId,'MESSAGE_NEW',{venueId:access.venueId,requestId:thread[1]},'reply');
          else {const customer=db.prepare('SELECT id FROM accounts WHERE request_owner=?').get(access.row.owner);if(customer)notify(db,customer.id,'MESSAGE_NEW',{venueId:access.venueId,requestId:thread[1]});}
        }
      });
      json(res,200,{ok:true});return true;
    }
    if(req.method==='GET') {
      const {limit,offset}=pagination(url.searchParams);
      json(res,200,page(db.prepare('SELECT id,kind,text,created_at AS createdAt FROM inquiry_messages WHERE request_id=? ORDER BY created_at,id LIMIT ? OFFSET ?').all(thread[1],limit+1,offset),limit,offset));return true;
    }
  }
  if(path==='/api/support' || path==='/api/admin/support' || /^\/api\/admin\/support\/[a-f0-9-]{36}$/.test(path)) {
    if(!account)fail(401,'ACCOUNT_REQUIRED','Sign in to contact support.');
    const admin=path.startsWith('/api/admin/');
    if(admin && !account.is_admin)fail(403,'ADMIN_REQUIRED','Admin access is required.');
    if(req.method==='POST') {
      const input=await body(req),now=new Date().toISOString();
      if(!admin) {
        if(!['ACCOUNT','LISTING','INQUIRY','OTHER'].includes(input.category) || typeof input.text!=='string' || !input.text.trim() || input.text.trim().length>2000)fail(422,'INVALID_TICKET','Choose a topic and describe the problem in 1–2000 characters.');
        if(db.prepare("SELECT count(*) AS n FROM support_tickets WHERE account_id=? AND status='OPEN'").get(account.id).n>=10)fail(422,'TICKET_LIMIT','You can have up to 10 open support requests.');
        const id=randomUUID();
        transaction(db,()=>{
          db.prepare('INSERT INTO support_tickets (id,account_id,category,text,created_at,updated_at) VALUES (?,?,?,?,?,?)').run(id,account.id,input.category,input.text.trim(),now,now);
          for(const reviewer of db.prepare('SELECT id FROM accounts WHERE is_admin=1').all())notify(db,reviewer.id,'SUPPORT_NEW',{});
        });
        json(res,201,{id});return true;
      }
      const id=path.split('/').at(-1);
      if(!['OPEN','CLOSED'].includes(input.status) || !Number.isSafeInteger(input.version) || typeof input.reply!=='string' || !input.reply.trim() || input.reply.trim().length>2000)fail(422,'INVALID_TICKET','Write a reply and choose the support status.');
      transaction(db,()=>{
        const ticket=db.prepare('SELECT * FROM support_tickets WHERE id=?').get(id);
        if(!ticket)fail(404,'NOT_FOUND','Support request not found.');
        if(ticket.version!==input.version)fail(409,'CONFLICT','Refresh this support request.');
        db.prepare('UPDATE support_tickets SET reply=?,status=?,version=version+1,updated_at=? WHERE id=?').run(input.reply.trim(),input.status,now,id);
        db.prepare('INSERT INTO support_history (ticket_id,actor,status,reply,created_at) VALUES (?,?,?,?,?)').run(id,account.id,input.status,input.reply.trim(),now);
        notify(db,ticket.account_id,'SUPPORT_REPLY',{});
      });
      json(res,200,{ok:true});return true;
    }
    if(req.method==='GET' && ['/api/support','/api/admin/support'].includes(path)) {
      const {limit,offset}=pagination(url.searchParams);
      const query=`SELECT id,category,text,reply,status,version,created_at AS createdAt,updated_at AS updatedAt FROM support_tickets ${admin?'':'WHERE account_id=?'} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`;
      const rows=db.prepare(query).all(...(admin?[]:[account.id]),limit+1,offset);
      json(res,200,page(rows,limit,offset));return true;
    }
  }
  return false;
}
