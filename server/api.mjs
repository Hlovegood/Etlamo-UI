import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { venues, findVenue } from '../src/data.js';
import { validateRequest } from '../src/domain.js';
import { securityAction, ownMailPreview } from './account-security.mjs';
import { notify, notificationView, pruneNotifications } from './notifications.mjs';
import { venueAccess, teamMembers, changeTeam } from './teams.mjs';
import { submissionView, reviewVenue } from './reviews.mjs';
import { accountFor, publicAccount, authenticate, submissionData } from './accounts.mjs';
import { createRequest, publicRequest, respond, reloadCatalog } from './database.mjs';
import { marketplaceApi, mediaRecord, availabilityFor, isBlocked } from './marketplace.mjs';
import { planningApi } from './planning.mjs';
import { providerApi, providerMediaRecord } from './providers.mjs';

const hash = token => createHash('sha256').update(token).digest('hex');
export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
export function json(res, status, data) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(JSON.stringify(data));
}
function session(db, req) {
  const token = (req.headers.cookie || '').match(/(?:^|;\s*)weddo_session=([a-f0-9]{64})(?:;|$)/)?.[1];
  return token ? db.prepare('SELECT * FROM sessions WHERE id=? AND expires>?').get(hash(token),Date.now()) : null;
}
function requireSession(db, req) {
  const found = session(db,req);
  if (!found) throw new ApiError(401,'SESSION_REQUIRED','Start a new session and try again.');
  return found;
}
function protectMutation(req, session) {
  if (req.headers.origin !== `http://${req.headers.host}`) throw new ApiError(403,'ORIGIN_REJECTED','Request origin is not allowed.');
  const token = req.headers['x-csrf-token'];
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || !timingSafeEqual(Buffer.from(token),Buffer.from(session.csrf))) throw new ApiError(403,'CSRF_REJECTED','Request token is missing or invalid.');
}
async function body(req) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new ApiError(400,'JSON_REQUIRED','Use a JSON request body.');
  // ponytail: plans are saved as one document; move to row-level updates if large shared events outgrow 512 KiB.
  const limit=req.url?.startsWith('/api/plans/')?524288:65536;
  let bytes = 0; const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > limit) throw new ApiError(413,'BODY_TOO_LARGE','Request body is too large.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new ApiError(400,'INVALID_JSON','Use a JSON object.'); }
}
function pagination(params) {
  const limit = params.get('limit') ?? '50', offset = params.get('offset') ?? '0';
  if (!/^\d{1,6}$/.test(limit) || !/^\d{1,9}$/.test(offset) || Number(limit) < 1 || Number(limit) > 50) throw new ApiError(400,'INVALID_PAGINATION','Use limit 1–50 and a nonnegative offset.');
  return { limit:Number(limit), offset:Number(offset) };
}
const page = (items,limit,offset) => ({items:items.slice(0,limit),nextOffset:items.length>limit?offset+limit:null});
function requestDetails(input) {
  return Object.fromEntries(['venueId','spaceId','packageId','date','guests','event','session'].map(key => [key,input?.[key]]));
}

function validateResponse(input) {
  if (!['OFFERED','DECLINED'].includes(input.status) || !Number.isSafeInteger(input.version) || input.version<0 || (input.status==='OFFERED' && (!Number.isSafeInteger(input.price) || input.price<=0 || input.price>1000000000)) || (input.status==='DECLINED' && !['DATE_UNAVAILABLE','PACKAGE_UNAVAILABLE'].includes(input.reason))) throw new ApiError(422,'INVALID_RESPONSE','Choose a valid response and price or reason.');
}

export async function handleApi(db, req, res, url) {
  const path = url.pathname;
  reloadCatalog(db);
  if(req.method==='GET' && path==='/api/health'){db.prepare('SELECT 1').get();json(res,200,{ok:true,mode:'local-preview'});return;}
  const media=path.match(/^\/api\/media\/([a-f0-9-]{36})$/);
  if(req.method==='GET' && media) {
    const active=session(db,req),account=active?accountFor(db,active):null,row=mediaRecord(db,media[1],account) || providerMediaRecord(db,media[1],account);
    if(!row)throw new ApiError(404,'NOT_FOUND','Photo not found.');
    res.writeHead(200,{'Content-Type':row.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Length':row.bytes.length});res.end(row.bytes);return;
  }
  if (req.method === 'GET' && path === '/api/session') {
    let found = session(db,req);
    if (!found) {
      const now=Date.now(),key=hash(`guest-session:${req.socket?.remoteAddress || 'local'}`);
      db.prepare('DELETE FROM auth_limits WHERE resets<=?').run(now);
      db.prepare('INSERT INTO auth_limits (key,attempts,resets) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').run(key,now+15*60000);
      if(db.prepare('SELECT attempts FROM auth_limits WHERE key=?').get(key).attempts>60)throw new ApiError(429,'TOO_MANY_SESSIONS','Wait 15 minutes before starting another session.');
      db.prepare('DELETE FROM sessions WHERE expires<=? AND NOT EXISTS (SELECT 1 FROM accounts WHERE request_owner=sessions.id) AND NOT EXISTS (SELECT 1 FROM requests WHERE owner=sessions.id)').run(now);
      const token = randomBytes(32).toString('hex');
      found = { id:hash(token),csrf:randomBytes(32).toString('hex'),expires:Date.now()+30*86400000 };
      db.prepare('INSERT INTO sessions (id,csrf,expires) VALUES (?,?,?)').run(found.id,found.csrf,found.expires);
      res.setHeader('Set-Cookie',`weddo_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
    }
    json(res,200,{csrfToken:found.csrf,isDemo:true,account:publicAccount(accountFor(db,found))}); return;
  }
  if (req.method === 'GET' && path === '/api/venues') {
    const {limit,offset}=pagination(url.searchParams);
    json(res,200,page(venues.slice(offset,offset+limit+1).map(venue=>({...venue,availability:availabilityFor(db,venue.id).map(({spaceId,date,session,blocked,updatedAt})=>({spaceId,date,session,blocked,updatedAt}))})),limit,offset)); return;
  }
  const active = requireSession(db,req);
  if (req.method !== 'GET') protectMutation(req,active);
  const account=accountFor(db,active);
  const owner={...active,id:account?.request_owner || active.id};
  if(await providerApi(db,req,res,url,{account,body,ErrorType:ApiError,json}))return;
  if(await planningApi(db,req,res,url,{account,body,ErrorType:ApiError,json}))return;
  if(await marketplaceApi(db,req,res,url,{account,owner,body,ErrorType:ApiError,json,pagination,page}))return;
  if(req.method==='POST' && ['/api/auth/register','/api/auth/login','/api/auth/logout'].includes(path)) {
    json(res,200,await authenticate(db,req,res,active,path.split('/').at(-1),await body(req),ApiError));return;
  }
  const securityPaths=['/api/account/verification/request','/api/account/verification/confirm','/api/auth/recovery/request','/api/auth/recovery/complete'];
  if(req.method==='POST' && securityPaths.includes(path)) {json(res,200,await securityAction(db,req,res,active,path,await body(req),ApiError));return;}
  if(req.method==='GET' && path==='/api/account/mail-preview') {
    if(!account)throw new ApiError(401,'ACCOUNT_REQUIRED','Sign in to see your local preview messages.');
    json(res,200,{items:ownMailPreview(db,account)});return;
  }
  if(path.startsWith('/api/notifications')) {
    if(!account)throw new ApiError(401,'ACCOUNT_REQUIRED','Sign in to view notifications.');
    pruneNotifications(db);
    if(req.method==='GET' && path==='/api/notifications') {
      const {limit,offset}=pagination(url.searchParams);
      const rows=db.prepare('SELECT * FROM notifications WHERE account_id=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(account.id,limit+1,offset);
      json(res,200,page(rows.map(notificationView),limit,offset));return;
    }
    if(req.method==='POST' && path==='/api/notifications/read') {
      const input=await body(req);
      if(input.id!=='all' && (typeof input.id!=='string' || !/^[a-f0-9-]{36}$/.test(input.id)))throw new ApiError(422,'INVALID_NOTIFICATION','Choose a notification.');
      const now=new Date().toISOString();
      if(input.id==='all')db.prepare('UPDATE notifications SET read_at=? WHERE account_id=? AND read_at IS NULL').run(now,account.id);
      else {
        if(!db.prepare('SELECT id FROM notifications WHERE id=? AND account_id=?').get(input.id,account.id))throw new ApiError(404,'NOT_FOUND','Notification not found.');
        db.prepare('UPDATE notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND account_id=?').run(now,input.id,account.id);
      }
      json(res,200,{ok:true});return;
    }
  }
  if(path.startsWith('/api/admin/')) {
    if(account?.is_admin!==1) throw new ApiError(403,'ADMIN_REQUIRED','Admin review access is required.');
    if(req.method==='GET' && path==='/api/admin/venues') {
      const {limit,offset}=pagination(url.searchParams);
      const rows=db.prepare("SELECT * FROM venue_submissions ORDER BY CASE status WHEN 'PENDING' THEN 0 ELSE 1 END,created_at DESC,id DESC LIMIT ? OFFSET ?").all(limit+1,offset);
      json(res,200,page(rows.map(row=>submissionView(db,row,true)),limit,offset));return;
    }
    const review=path.match(/^\/api\/admin\/venues\/([a-z0-9-]{1,80})\/reviews$/);
    if(req.method==='POST' && review) {
      const result=reviewVenue(db,review[1],await body(req),account.id);
      if(result.error) throw new ApiError(result.error==='NOT_FOUND'?404:result.error==='CONFLICT'?409:422,result.error,'Check the review details or refresh this submission.');
      json(res,200,result);return;
    }
  }
  if(path.startsWith('/api/vendor/')) {
    if(account?.role!=='vendor') throw new ApiError(403,'VENDOR_REQUIRED','Sign in with a vendor account.');
    const team=path.match(/^\/api\/vendor\/venues\/([a-z0-9-]{1,80})\/team(?:\/([a-f0-9-]{36}))?$/);
    if(team) {
      if(!venueAccess(db,team[1],account.id)?.canManageTeam) throw new ApiError(404,'NOT_FOUND','Venue team not found.');
      if(req.method==='GET' && !team[2]) {json(res,200,{members:teamMembers(db,team[1])});return;}
      if(req.method==='POST') {
        const result=changeTeam(db,team[1],account.id,await body(req),team[2]);
        if(result.error) throw new ApiError(result.error==='NOT_FOUND'?404:['CONFLICT','MEMBER_EXISTS'].includes(result.error)?409:422,result.error,'Check the team member or refresh their permissions.');
        json(res,200,result);return;
      }
    }
    if(req.method==='GET' && path==='/api/vendor/venues') {
      const {limit,offset}=pagination(url.searchParams);
      const items=db.prepare('SELECT v.* FROM venue_submissions v WHERE v.owner=? OR EXISTS (SELECT 1 FROM venue_team t WHERE t.venue_id=v.id AND t.account_id=? AND t.active=1) ORDER BY v.created_at DESC,v.id DESC LIMIT ? OFFSET ?').all(account.id,account.id,limit+1,offset).map(row=>({...submissionView(db,row),access:venueAccess(db,row.id,account.id)}));
      json(res,200,page(items,limit,offset));return;
    }
    const edit=path.match(/^\/api\/vendor\/venues\/([a-z0-9-]{1,80})$/);
    if(req.method==='POST' && (path==='/api/vendor/venues' || edit)) {
      const input=await body(req);
      const data=submissionData(input,ApiError);
      const id=edit?.[1] || `venue-${randomUUID()}`;
      if(edit) {
        if(!venueAccess(db,id,account.id)?.canEdit) throw new ApiError(404,'NOT_FOUND','Venue not found.');
        const current=db.prepare('SELECT version FROM venue_submissions WHERE id=?').get(id);
        if(!Number.isSafeInteger(input.version) || input.version!==current.version) throw new ApiError(409,'CONFLICT','Refresh the venue before submitting edits.');
        for(const row of db.prepare("SELECT data FROM requests WHERE json_extract(data,'$.venueId')=?").all(id)) {
          const inquiry=JSON.parse(row.data),space=data.spaces.find(s=>s.id===inquiry.spaceId);
          if(!space || space.capacity<inquiry.guests || !data.packages.some(p=>p.id===inquiry.packageId))throw new ApiError(422,'INQUIRY_DEPENDENCY','Keep spaces and packages used by existing inquiries, with sufficient capacity.');
        }
        if(data.media.some(mediaId=>!db.prepare('SELECT id FROM venue_media WHERE id=? AND venue_id=?').get(mediaId,id)))throw new ApiError(422,'INVALID_PHOTO','Choose photos uploaded to this venue.');
        const result=db.prepare("UPDATE venue_submissions SET data=?,status='PENDING',version=version+1 WHERE id=? AND version=?").run(JSON.stringify(data),id,input.version);
        if(!result.changes) throw new ApiError(404,'NOT_FOUND','Venue not found.');
      } else {
        if(data.media.length)throw new ApiError(422,'INVALID_PHOTO','Save the venue before adding photos.');
        db.prepare('INSERT INTO venue_submissions (id,owner,data,status,created_at) VALUES (?,?,?,?,?)').run(id,account.id,JSON.stringify(data),'PENDING',new Date().toISOString());
      }
      for(const admin of db.prepare('SELECT id FROM accounts WHERE is_admin=1').all())notify(db,admin.id,'SUBMISSION_PENDING',{venueId:id});
      json(res,edit?200:201,{venue:{...data,id,status:'PENDING'}});return;
    }
    if(req.method==='GET' && path==='/api/vendor/requests') {
      const {limit,offset}=pagination(url.searchParams);
      const rows=db.prepare("SELECT r.* FROM requests r JOIN venue_submissions v ON v.id=json_extract(r.data,'$.venueId') WHERE (v.owner=? OR EXISTS (SELECT 1 FROM venue_team t WHERE t.venue_id=v.id AND t.account_id=? AND t.active=1 AND t.permission IN ('RESPONDER','BOTH'))) ORDER BY r.created_at DESC,r.id DESC LIMIT ? OFFSET ?").all(account.id,account.id,limit+1,offset);
      json(res,200,page(rows.map(publicRequest),limit,offset));return;
    }
    const reply=path.match(/^\/api\/vendor\/venues\/([a-z0-9-]{1,80})\/requests\/([a-f0-9-]{36})\/responses$/);
    if(req.method==='POST' && reply) {
      const row=db.prepare('SELECT owner FROM requests WHERE id=?').get(reply[2]);
      const input=await body(req);validateResponse(input);
      if(!venueAccess(db,reply[1],account.id)?.canReply || !row) throw new ApiError(404,'NOT_FOUND','Request not found.');
      const result=respond(db,row.owner,reply[1],reply[2],input);
      if(result.error) throw new ApiError(result.error==='CONFLICT'?409:404,result.error,'This request is unavailable or has already changed.');
      json(res,200,result);return;
    }
  }
  if (req.method === 'GET' && path === '/api/requests') {
    const {limit,offset}=pagination(url.searchParams);
    const rows=db.prepare('SELECT * FROM requests WHERE owner=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?').all(owner.id,limit+1,offset);
    json(res,200,page(rows.map(publicRequest),limit,offset)); return;
  }
  if (req.method === 'POST' && path === '/api/requests') {
    const details=requestDetails(await body(req));
    const error=validateRequest(details);
    if (error) throw new ApiError(422,error==='capacity'?'CAPACITY_EXCEEDED':error==='date'?'INVALID_DATE':'INVALID_SELECTION','Check your date, space, guests, and package.');
    if(isBlocked(db,details))throw new ApiError(409,'DATE_BLOCKED','The venue has blocked this space and session. Choose another time.');
    const result=createRequest(db,owner.id,details);
    json(res,result.duplicate?200:201,result); return;
  }
  if (req.method === 'POST' && path === '/api/requests/imports') {
    const input=await body(req);
    if (!Array.isArray(input.requests) || input.requests.length>100) throw new ApiError(400,'INVALID_IMPORT','Import up to 100 local drafts at a time.');
    let imported=0,rejected=0;
    for (const item of input.requests) {
      const details=requestDetails(item);
      if (validateRequest(details,false)) { rejected++; continue; }
      createRequest(db,owner.id,details,'DRAFT'); imported++;
    }
    json(res,200,{imported,rejected}); return;
  }
  const queue=path.match(/^\/api\/demo\/venues\/([a-z0-9-]+)\/requests$/);
  if (req.method === 'GET' && queue) {
    if (!findVenue(queue[1])) throw new ApiError(404,'NOT_FOUND','Venue not found.');
    const {limit,offset}=pagination(url.searchParams);
    const rows=db.prepare("SELECT * FROM requests WHERE owner=? AND json_extract(data,'$.venueId')=? ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?").all(owner.id,queue[1],limit+1,offset);
    json(res,200,page(rows.map(publicRequest),limit,offset)); return;
  }
  const response=path.match(/^\/api\/demo\/venues\/([a-z0-9-]+)\/requests\/([a-f0-9-]{36})\/responses$/);
  if (req.method === 'POST' && response) {
    const input=await body(req);
    validateResponse(input);
    if(db.prepare('SELECT id FROM venue_submissions WHERE id=?').get(response[1])) throw new ApiError(403,'DEMO_ONLY','Use the vendor account for this venue.');
    const result=respond(db,owner.id,response[1],response[2],input);
    if (result.error) throw new ApiError(result.error==='CONFLICT'?409:404,result.error,'This request is unavailable or has already changed.');
    json(res,200,result); return;
  }
  throw new ApiError(404,'NOT_FOUND','Endpoint not found.');
}
