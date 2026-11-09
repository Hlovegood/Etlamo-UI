import { randomBytes, randomUUID, createHash, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { transaction } from './database.mjs';
import { accountFor, publicAccount, rotateSession } from './accounts.mjs';
const derive=promisify(scrypt);
const hash=value=>createHash('sha256').update(value).digest('hex');
function clean(db) {
  db.prepare('DELETE FROM mail_preview WHERE expires<=?').run(Date.now());
  db.prepare('DELETE FROM account_tokens WHERE expires<=? OR used=1').run(Date.now());
}
function limit(db,req,key,ErrorType) {
  const now=Date.now();db.prepare('DELETE FROM auth_limits WHERE resets<=?').run(now);
  for(const value of [`security-ip:${req.socket?.remoteAddress || 'local'}`,`security-key:${key}`]) {
    const id=hash(value);
    db.prepare('INSERT INTO auth_limits (key,attempts,resets) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').run(id,now+15*60000);
    if(db.prepare('SELECT attempts FROM auth_limits WHERE key=?').get(id).attempts>10)throw new ErrorType(429,'TOO_MANY_ATTEMPTS','Try again in 15 minutes.');
  }
}
function queue(db,account,purpose,host) {
  const token=randomBytes(32).toString('hex'),expires=Date.now()+(purpose==='VERIFY'?24*60:30)*60000;
  transaction(db,()=>{
    db.prepare('UPDATE account_tokens SET used=1 WHERE account_id=? AND purpose=?').run(account.id,purpose);
    db.prepare('DELETE FROM mail_preview WHERE account_id=? AND purpose=?').run(account.id,purpose);
    db.prepare('INSERT INTO account_tokens (token_hash,account_id,purpose,expires) VALUES (?,?,?,?)').run(hash(token),account.id,purpose,expires);
    db.prepare('INSERT INTO mail_preview (id,account_id,purpose,url,expires,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(),account.id,purpose,`http://${host}/#/account/${purpose==='VERIFY'?'verify':'reset'}?token=${token}`,expires,new Date().toISOString());
  });
}
export async function securityAction(db,req,res,session,path,input,ErrorType) {
  clean(db);
  const account=accountFor(db,session);
  if(path==='/api/account/verification/request') {
    if(!account)throw new ErrorType(401,'ACCOUNT_REQUIRED','Sign in first.');
    limit(db,req,`verify:${account.id}`,ErrorType);
    if(!account.email_verified)queue(db,account,'VERIFY',req.headers.host);
    return {queued:true,delivery:'LOCAL_PREVIEW'};
  }
  if(path==='/api/auth/recovery/request') {
    const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
    if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ErrorType(422,'INVALID_ACCOUNT','Enter a valid email.');
    limit(db,req,`reset:${email}`,ErrorType);
    const target=db.prepare('SELECT * FROM accounts WHERE email=?').get(email);
    if(target)queue(db,target,'RESET',req.headers.host);
    // Identical response whether or not the email belongs to an account. No recovery token leaves this endpoint.
    return {queued:true,delivery:'LOCAL_PREVIEW'};
  }
  if(!['/api/account/verification/confirm','/api/auth/recovery/complete'].includes(path))throw new ErrorType(404,'NOT_FOUND','Endpoint not found.');
  const purpose=path.endsWith('/confirm')?'VERIFY':'RESET';
  limit(db,req,`consume:${purpose}:${typeof input.token==='string'?input.token.slice(0,64):'invalid'}`,ErrorType);
  if(typeof input.token!=='string' || !/^[a-f0-9]{64}$/.test(input.token))throw new ErrorType(422,'INVALID_LINK','This link is invalid or expired.');
  const digest=hash(input.token);
  const valid=()=>db.prepare('SELECT * FROM account_tokens WHERE token_hash=? AND purpose=? AND used=0 AND expires>?').get(digest,purpose,Date.now());
  const record=valid();
  if(!record)throw new ErrorType(422,'INVALID_LINK','This link is invalid or expired.');
  if(purpose==='VERIFY') {
    transaction(db,()=>{
      if(!valid())throw new ErrorType(422,'INVALID_LINK','This link is invalid or expired.');
      db.prepare('UPDATE accounts SET email_verified=1 WHERE id=?').run(record.account_id);
      db.prepare("UPDATE account_tokens SET used=1 WHERE account_id=? AND purpose='VERIFY'").run(record.account_id);
      db.prepare("DELETE FROM mail_preview WHERE account_id=? AND purpose='VERIFY'").run(record.account_id);
    });
    return {ok:true,account:publicAccount(accountFor(db,session))};
  }
  if(typeof input.password!=='string' || input.password.length<12 || Buffer.byteLength(input.password)>256)throw new ErrorType(422,'INVALID_ACCOUNT','Use a password with at least 12 characters.');
  const salt=randomBytes(16).toString('hex');
  const password=`${salt}:${(await derive(input.password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024})).toString('hex')}`;
  transaction(db,()=>{
    if(!valid())throw new ErrorType(422,'INVALID_LINK','This link is invalid or expired.');
    db.prepare('UPDATE accounts SET password=? WHERE id=?').run(password,record.account_id);
    db.prepare('UPDATE sessions SET expires=0 WHERE user_id=?').run(record.account_id);
    db.prepare("UPDATE account_tokens SET used=1 WHERE account_id=? AND purpose='RESET'").run(record.account_id);
    db.prepare("DELETE FROM mail_preview WHERE account_id=? AND purpose='RESET'").run(record.account_id);
  });
  return {ok:true,account:null,csrfToken:rotateSession(db,res,session)};
}
export function ownMailPreview(db,account) {
  clean(db);
  return db.prepare('SELECT id,purpose,url,expires,created_at AS createdAt FROM mail_preview WHERE account_id=? ORDER BY created_at DESC').all(account.id);
}
