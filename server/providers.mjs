import { randomUUID } from 'node:crypto';
import { areas } from '../src/areas.js';
import { validDate } from '../src/domain.js';
import { notify } from './notifications.mjs';
import { readPhotoBytes } from './marketplace.mjs';

const categories=['photography','catering','decor','flowers','entertainment'];
const specialties={photography:['photo','video','both'],catering:['buffet','plated','desserts'],decor:['stage','tables','full'],flowers:['bouquets','venue','full'],entertainment:['music','dj','performance']};
const named=(value,max)=>value && ['en','ar'].every(lang=>typeof value[lang]==='string' && value[lang].trim().length>0 && value[lang].trim().length<=max);
const packages=data=>data.packages || [{id:'classic',name:data.packageName,price:data.price}];
const publicData=data=>({...data,packages:packages(data),price:Math.min(...packages(data).map(item=>item.price))});
const view=row=>({id:row.id,...JSON.parse(row.data),status:row.status,reviewNote:row.review_note,version:row.version,updatedAt:row.updated_at,published:row.published?JSON.parse(row.published):null});
const inquiry=row=>({id:row.id,providerId:row.provider_id,customerId:row.customer_id,...JSON.parse(row.data),status:row.status,quote:row.quote,version:row.version,createdAt:row.created_at});
export function providerMediaRecord(db,id,account) {
  const row=db.prepare('SELECT * FROM provider_media WHERE id=?').get(id);
  if(!row)return null;
  const provider=db.prepare('SELECT owner,published FROM provider_submissions WHERE id=?').get(row.provider_id);
  if(!provider)return null;
  if(!JSON.parse(provider.published || '{}').media?.includes(id) && !account?.is_admin && account?.id!==provider.owner)return null;
  return row;
}

export async function providerApi(db,req,res,url,{account,body,ErrorType:E,json}) {
  const path=url.pathname;
  if(!['/api/providers','/api/vendor/providers','/api/admin/providers','/api/provider-inquiries','/api/vendor/provider-inquiries'].includes(path) && !/^\/api\/(?:vendor\/providers|admin\/providers|vendor\/provider-inquiries)\/[a-f0-9-]{36}(?:\/review|\/reply|\/photos)?$/.test(path))return false;
  const fail=(status,code,message)=>{throw new E(status,code,message);};
  if(path==='/api/providers' && req.method==='GET'){
    json(res,200,{items:db.prepare('SELECT id,published FROM provider_submissions WHERE published IS NOT NULL ORDER BY updated_at DESC LIMIT 200').all().map(row=>({id:row.id,...publicData(JSON.parse(row.published))}))});return true;
  }
  if(path.startsWith('/api/vendor/')){
    if(account?.role!=='vendor')fail(403,'VENDOR_REQUIRED','Sign in with a vendor account.');
    if(path==='/api/vendor/providers' && req.method==='GET'){
      json(res,200,{items:db.prepare('SELECT * FROM provider_submissions WHERE owner=? ORDER BY updated_at DESC LIMIT 50').all(account.id).map(view)});return true;
    }
    const upload=path.match(/^\/api\/vendor\/providers\/([a-f0-9-]{36})\/photos$/);
    if(upload && req.method==='POST'){
      if(!db.prepare('SELECT id FROM provider_submissions WHERE id=? AND owner=?').get(upload[1],account.id))fail(404,'NOT_FOUND','Service not found.');
      if(db.prepare('SELECT count(*) AS n FROM provider_media WHERE provider_id=?').get(upload[1]).n>=20)fail(422,'MEDIA_LIMIT','This service has reached its upload limit.');
      const {type,bytes}=await readPhotoBytes(req,E),id=randomUUID();
      db.prepare('INSERT INTO provider_media (id,provider_id,type,bytes,created_at) VALUES (?,?,?,?,?)').run(id,upload[1],type,bytes,new Date().toISOString());
      json(res,201,{id});return true;
    }
    const edit=path.match(/^\/api\/vendor\/providers\/([a-f0-9-]{36})$/);
    if(req.method==='POST' && (path==='/api/vendor/providers' || edit)){
      const input=await body(req);
      const data={name:input.name,description:input.description,category:input.category,area:input.area,specialty:input.specialty,packages:input.packages,media:input.media || []};
      if(!named(data.name,120)||!named(data.description,1200)||!categories.includes(data.category)||!areas.some(a=>a.id===data.area)||!specialties[data.category]?.includes(data.specialty)||!Array.isArray(data.packages)||data.packages.length<1||data.packages.length>3||data.packages.some(p=>!p||typeof p!=='object'||!named(p.name,120)||typeof p.id!=='string'||!/^package-[1-3]$/.test(p.id)||!Number.isSafeInteger(p.price)||p.price<1||p.price>1000000000)||new Set(data.packages.map(p=>p.id)).size!==data.packages.length||!Array.isArray(data.media)||data.media.length>3||new Set(data.media).size!==data.media.length||data.media.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))fail(422,'INVALID_PROVIDER','Complete the service details.');
      for(const pair of [data.name,data.description,...data.packages.map(p=>p.name)])for(const lang of ['en','ar'])pair[lang]=pair[lang].trim();
      const now=new Date().toISOString(),id=edit?.[1]||randomUUID();
      if(data.media.some(mediaId=>!db.prepare('SELECT id FROM provider_media WHERE id=? AND provider_id=?').get(mediaId,id)))fail(422,'INVALID_PHOTO','Choose photos uploaded to this service.');
      if(edit){
        if(!Number.isSafeInteger(input.version)||!db.prepare("UPDATE provider_submissions SET data=?,status='PENDING',review_note='',version=version+1,updated_at=? WHERE id=? AND owner=? AND version=?").run(JSON.stringify(data),now,id,account.id,input.version).changes)fail(409,'CONFLICT','Refresh your listing before editing.');
      }else{
        if(data.media.length)fail(422,'INVALID_PHOTO','Save the service before adding photos.');
        if(db.prepare('SELECT count(*) AS n FROM provider_submissions WHERE owner=?').get(account.id).n>=20)fail(422,'PROVIDER_LIMIT','You can submit up to 20 services.');
        db.prepare('INSERT INTO provider_submissions (id,owner,data,status,updated_at) VALUES (?,?,?,?,?)').run(id,account.id,JSON.stringify(data),'PENDING',now);
      }
      for(const admin of db.prepare('SELECT id FROM accounts WHERE is_admin=1').all())notify(db,admin.id,'PROVIDER_PENDING',{providerId:id});
      json(res,edit?200:201,{provider:view(db.prepare('SELECT * FROM provider_submissions WHERE id=?').get(id))});return true;
    }
    if(path==='/api/vendor/provider-inquiries' && req.method==='GET'){
      json(res,200,{items:db.prepare('SELECT i.* FROM provider_inquiries i JOIN provider_submissions p ON p.id=i.provider_id WHERE p.owner=? ORDER BY i.created_at DESC LIMIT 200').all(account.id).map(inquiry)});return true;
    }
    const reply=path.match(/^\/api\/vendor\/provider-inquiries\/([a-f0-9-]{36})\/reply$/);
    if(reply && req.method==='POST'){
      const input=await body(req);
      if(!['OFFERED','DECLINED'].includes(input.status)||!Number.isSafeInteger(input.version)||input.version<0||(input.status==='OFFERED'&&(!Number.isSafeInteger(input.quote)||input.quote<1||input.quote>1000000000)))fail(422,'INVALID_REPLY','Choose a valid response and quote.');
      const result=db.prepare("UPDATE provider_inquiries SET status=?,quote=?,version=version+1 WHERE id=? AND version=? AND status='PENDING' AND provider_id IN (SELECT id FROM provider_submissions WHERE owner=?)").run(input.status,input.status==='OFFERED'?input.quote:null,reply[1],input.version,account.id);
      if(!result.changes)fail(409,'CONFLICT','This inquiry changed. Refresh it.');
      const customer=db.prepare('SELECT customer_id FROM provider_inquiries WHERE id=?').get(reply[1]);
      notify(db,customer.customer_id,'PROVIDER_REPLY',{providerId:db.prepare('SELECT provider_id FROM provider_inquiries WHERE id=?').get(reply[1]).provider_id});
      json(res,200,{ok:true});return true;
    }
  }
  if(path.startsWith('/api/admin/')){
    if(!account?.is_admin)fail(403,'ADMIN_REQUIRED','Admin access is required.');
    if(path==='/api/admin/providers' && req.method==='GET'){
      json(res,200,{items:db.prepare("SELECT * FROM provider_submissions ORDER BY CASE status WHEN 'PENDING' THEN 0 ELSE 1 END,updated_at DESC LIMIT 200").all().map(view)});return true;
    }
    const review=path.match(/^\/api\/admin\/providers\/([a-f0-9-]{36})\/review$/);
    if(review && req.method==='POST'){
      const input=await body(req);
      if(!['APPROVED','CHANGES'].includes(input.decision)||!Number.isSafeInteger(input.version)||input.version<0||typeof input.note!=='string'||input.note.length>1000||(input.decision==='CHANGES'&&!input.note.trim()))fail(422,'INVALID_REVIEW','Add a reason when requesting changes.');
      const row=db.prepare('SELECT * FROM provider_submissions WHERE id=? AND version=? AND status=?').get(review[1],input.version,'PENDING');
      if(!row)fail(409,'CONFLICT','This submission changed. Refresh it.');
      const result=db.prepare('UPDATE provider_submissions SET status=?,published=?,review_note=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(input.decision,input.decision==='APPROVED'?row.data:row.published,String(input.note||'').trim(),new Date().toISOString(),row.id,input.version);
      if(!result.changes)fail(409,'CONFLICT','This submission changed. Refresh it.');
      notify(db,row.owner,input.decision==='APPROVED'?'PROVIDER_APPROVED':'PROVIDER_CHANGES',{providerId:row.id});
      json(res,200,{ok:true});return true;
    }
  }
  if(path==='/api/provider-inquiries'){
    if(!account)fail(401,'ACCOUNT_REQUIRED','Sign in to inquire about a service.');
    if(req.method==='GET'){
      json(res,200,{items:db.prepare('SELECT * FROM provider_inquiries WHERE customer_id=? ORDER BY created_at DESC LIMIT 200').all(account.id).map(inquiry)});return true;
    }
    if(req.method==='POST'){
      const input=await body(req),provider=db.prepare('SELECT published FROM provider_submissions WHERE id=?').get(input.providerId);
      if(!provider?.published||!validDate(input.date)||!['wedding','conference','other'].includes(input.event)||typeof input.note!=='string'||input.note.length>1000)fail(422,'INVALID_INQUIRY','Choose a service, package, date and event.');
      if(db.prepare('SELECT count(*) AS n FROM provider_inquiries WHERE customer_id=?').get(account.id).n>=200)fail(422,'INQUIRY_LIMIT','This account has reached its service inquiry limit.');
      const snapshot=JSON.parse(provider.published),selected=packages(snapshot).find(item=>item.id===input.packageId);
      if(!selected)fail(422,'INVALID_PACKAGE','Choose an available package.');
      const id=randomUUID(),now=new Date().toISOString();
      db.prepare('INSERT INTO provider_inquiries (id,provider_id,customer_id,data,status,created_at) VALUES (?,?,?,?,?,?)').run(id,input.providerId,account.id,JSON.stringify({date:input.date,event:input.event,note:input.note.trim(),providerName:snapshot.name,packageId:selected.id,packageName:selected.name,guidePrice:selected.price}),'PENDING',now);
      notify(db,db.prepare('SELECT owner FROM provider_submissions WHERE id=?').get(input.providerId).owner,'PROVIDER_INQUIRY',{providerId:input.providerId});
      json(res,201,{id});return true;
    }
  }
  return false;
}
