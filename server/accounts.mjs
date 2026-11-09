import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { areas } from '../src/areas.js';
import { guestCounts, venueKinds, venueAmenities, packageInclusions } from '../src/data.js';
import { transaction } from './database.mjs';
const derive = promisify(scrypt);
const digest = value=>createHash('sha256').update(value).digest('hex');
export const accountFor = (db,session)=>session.user_id ? db.prepare('SELECT * FROM accounts WHERE id=?').get(session.user_id) : null;
export const publicAccount = account=>account ? {id:account.id,email:account.email,role:account.role,isAdmin:account.is_admin===1,emailVerified:account.email_verified===1} : null;
export function rotateSession(db,res,old,userId=null) {
  const token=randomBytes(32).toString('hex'), csrf=randomBytes(32).toString('hex');
  transaction(db,()=>{
    db.prepare('UPDATE sessions SET expires=0 WHERE id=?').run(old.id);
    db.prepare('INSERT INTO sessions (id,csrf,expires,user_id) VALUES (?,?,?,?)').run(digest(token),csrf,Date.now()+30*86400000,userId);
  });
  res.setHeader('Set-Cookie',`weddo_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`);
  return csrf;
}
export async function authenticate(db,req,res,session,mode,input,ErrorType) {
  if(mode==='logout') return {csrfToken:rotateSession(db,res,session),account:null};
  if(session.user_id) throw new ErrorType(409,'ALREADY_SIGNED_IN','Sign out before changing accounts.');
  const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
  const password=typeof input.password==='string'?input.password:'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>254 || password.length<12 || Buffer.byteLength(password)>256 || (mode==='register' && !['customer','vendor'].includes(input.role))) throw new ErrorType(422,'INVALID_ACCOUNT','Use a valid email, a password of 12–256 bytes, and a customer or vendor role.');
  const now=Date.now();
  // Persistent limits survive server restarts. Never store email/password in limiter keys.
  db.prepare('DELETE FROM auth_limits WHERE resets<?').run(now);
  for(const key of [digest(`ip:${req.socket?.remoteAddress || 'local'}`),digest(`email:${email}`)]) {
    db.prepare('INSERT INTO auth_limits (key,attempts,resets) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').run(key,now+15*60000);
    if(db.prepare('SELECT attempts FROM auth_limits WHERE key=?').get(key).attempts>10) throw new ErrorType(429,'TOO_MANY_ATTEMPTS','Wait 15 minutes before trying again.');
  }
  let account=db.prepare('SELECT * FROM accounts WHERE email=?').get(email);
  if(mode==='register') {
    const salt=randomBytes(16).toString('hex');
    const encoded=`${salt}:${(await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex')}`;
    try {
      const id=randomUUID();
      db.prepare('INSERT INTO accounts (id,email,password,role,request_owner) VALUES (?,?,?,?,?)').run(id,email,encoded,input.role,session.id);
      account=db.prepare('SELECT * FROM accounts WHERE id=?').get(id);
    } catch(error) {
      if(error.code==='ERR_SQLITE_ERROR' && db.prepare('SELECT id FROM accounts WHERE email=?').get(email)) throw new ErrorType(409,'ACCOUNT_UNAVAILABLE','This email cannot be registered. Try signing in.');
      throw error;
    }
  } else {
    const [salt,expected]=(account?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
    const actual=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
    if(!timingSafeEqual(actual,Buffer.from(expected,'hex')) || !account) throw new ErrorType(401,'INVALID_CREDENTIALS','Email or password is incorrect.');
  }
  return {account:publicAccount(account),csrfToken:rotateSession(db,res,session,account.id)};
}
export function submissionData(input,ErrorType) {
  const text=(value,max)=>typeof value==='string' && value.trim().length>0 && value.trim().length<=max;
  const invalid=()=>{throw new ErrorType(422,'INVALID_VENUE','Complete the venue, spaces and packages with valid details.');};
  if(!text(input.nameEn,120) || !text(input.nameAr,120) || !text(input.descriptionEn,1200) || !text(input.descriptionAr,1200) || !areas.some(area=>area.id===input.area) || !venueKinds.includes(input.kind))invalid();
  const allowed=venueAmenities;
  if(!Array.isArray(input.amenities) || input.amenities.some(value=>!allowed.includes(value))) throw new ErrorType(422,'INVALID_VENUE','Choose valid amenities.');
  const spaces=input.spaces ?? [{id:'main',name:{en:'Main space',ar:'المساحة الرئيسية'},capacity:input.capacity}];
  const packages=input.packages ?? [{id:'essential',price:input.price,includes:['spaceHire','tables','sound']}];
  const validList=list=>Array.isArray(list) && list.length>0 && list.length<=8 && list.every(item=>item && typeof item.id==='string' && /^[a-z0-9-]{1,80}$/.test(item.id)) && new Set(list.map(item=>item.id)).size===list.length;
  const name=value=>value && text(value.en,120) && text(value.ar,120);
  if(!validList(spaces) || spaces.some(s=>!name(s.name) || !guestCounts.includes(s.capacity)) || !validList(packages) || packages.some(p=>(p.name?!name(p.name):!['essential','celebration'].includes(p.id)) || !Number.isSafeInteger(p.price) || p.price<1 || p.price>1000000000 || !Array.isArray(p.includes) || !p.includes.length || p.includes.some(key=>!packageInclusions.includes(key))))invalid();
  const media=input.media ?? [];
  if(!Array.isArray(media) || media.length>8 || media.some(id=>typeof id!=='string' || !/^[a-f0-9-]{36}$/.test(id)) || new Set(media).size!==media.length)invalid();
  if(spaces.some(s=>(s.enabled!==undefined && typeof s.enabled!=='boolean') || (s.kind && !venueKinds.includes(s.kind)) || (s.amenities && (!Array.isArray(s.amenities) || s.amenities.some(key=>!allowed.includes(key)))) || (s.mediaId && !media.includes(s.mediaId))))invalid();
  return {name:{en:input.nameEn.trim(),ar:input.nameAr.trim()},description:{en:input.descriptionEn.trim(),ar:input.descriptionAr.trim()},area:input.area,kind:input.kind,theme:{garden:'garden',ballroom:'coral',courtyard:'blue',conferenceRoom:'blue',conferenceHall:'blue'}[input.kind],isSample:false,amenities:[...new Set(input.amenities)],spaces:spaces.map(s=>({id:s.id,name:{en:s.name.en.trim(),ar:s.name.ar.trim()},capacity:s.capacity,kind:s.kind || input.kind,amenities:[...new Set(s.amenities || [])],mediaId:s.mediaId || null,enabled:s.enabled!==false})),packages:packages.map(p=>({id:p.id,...(p.name?{name:{en:p.name.en.trim(),ar:p.name.ar.trim()}}:{}),price:p.price,includes:[...new Set(p.includes)]})),media};
}
