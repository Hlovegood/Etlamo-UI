import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../server/database.mjs';
import { client } from './client.mjs';
import { searchVenues, today } from '../src/domain.js';

const password='A-local-test-password-2035';
const listing={nameEn:'Test venue',nameAr:'مكان للاختبار',descriptionEn:'A venue used only in automated checks.',descriptionAr:'مكان لتجربة النظام فقط.',area:'heliopolis',kind:'garden',amenities:['parking'],capacity:200,price:100000};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7ZkAAAAASUVORK5CYII=','base64');

test('local MVP permissions, publication and customer workflows',async t=>{
  const db=openDatabase(':memory:');t.after(()=>db.close());
  const vendor=client(db),customer=client(db),staff=client(db),other=client(db),admin=client(db),guest=client(db);
  for(const [c,email,role] of [[vendor,'venue@example.test','vendor'],[customer,'couple@example.test','customer'],[staff,'staff@example.test','vendor'],[other,'other@example.test','vendor'],[admin,'admin@example.test','customer']]) {
    await c.call('GET','/api/session');
    assert.equal((await c.call('POST','/api/auth/register',{email,password,role})).status,200);
  }
  db.prepare('UPDATE accounts SET is_admin=1 WHERE email=?').run('admin@example.test');
  await guest.call('GET','/api/session');
  let id,photoId,request,version;
  const data={...listing,spaces:[{id:'main',name:{en:'Hall',ar:'القاعة'},capacity:200},{id:'garden',name:{en:'Garden',ar:'الحديقة'},capacity:100}],packages:[{id:'essential',name:{en:'Space package',ar:'باقة المكان'},price:100000,includes:['spaceHire','tables']},{id:'complete',name:{en:'Full celebration',ar:'الاحتفال الكامل'},price:300000,includes:['spaceHire','sound','decor']}],media:[]};
  await t.test('reviewed catalog, safe media and stale submission protection',async()=>{
    const created=await vendor.call('POST','/api/vendor/venues',listing);
    assert.equal(created.status,201);id=created.data.venue.id;
    assert.equal((await guest.call('GET','/api/venues')).data.items.some(v=>v.id===id),false);
    assert.equal((await other.call('POST',`/api/vendor/venues/${id}`,{...data,version:0})).status,404);
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}/photos`,Buffer.from('<svg/>'),{'content-type':'image/svg+xml'})).status,422);
    assert.equal((await other.call('POST',`/api/vendor/venues/${id}/photos`,png,{'content-type':'image/png'})).status,404);
    const upload=await vendor.call('POST',`/api/vendor/venues/${id}/photos`,png,{'content-type':'image/png'});
    assert.equal(upload.status,201);photoId=upload.data.id;data.media=[photoId];
    assert.equal((await guest.call('GET',`/api/media/${photoId}`)).status,404);
    assert.deepEqual((await vendor.call('GET',`/api/media/${photoId}`)).data,png);
    assert.equal((await admin.call('GET',`/api/media/${photoId}`)).status,200);
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}`,{...data,version:0})).status,200);
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}`,{...data,version:0})).status,409);
    assert.equal((await customer.call('GET','/api/admin/venues')).status,403);
    assert.equal((await admin.call('POST',`/api/admin/venues/${id}/reviews`,{decision:'APPROVED',version:0,note:''})).status,409);
    const reviewed=await admin.call('POST',`/api/admin/venues/${id}/reviews`,{decision:'APPROVED',version:1,note:'Local test only'});
    assert.equal(reviewed.status,200);version=reviewed.data.venue.version;
    const published=(await guest.call('GET','/api/venues')).data.items.find(v=>v.id===id);
    assert.equal(published.spaces.length,2);assert.equal(published.packages[1].id,'complete');
    assert.equal((await guest.call('GET',`/api/media/${photoId}`)).headers['X-Content-Type-Options'],'nosniff');
  });
  await t.test('account favorites survive login and remain private',async()=>{
    assert.equal((await guest.call('GET','/api/favorites')).status,401);
    assert.equal((await customer.call('POST','/api/favorites',{venueId:id,saved:true})).status,200);
    assert.deepEqual((await other.call('GET','/api/favorites')).data.ids,[]);
    await customer.call('POST','/api/auth/logout',{});
    await customer.call('POST','/api/auth/login',{email:'couple@example.test',password});
    assert.deepEqual((await customer.call('GET','/api/favorites')).data.ids,[id]);
  });
  await t.test('staff capabilities and audited date conflicts',async()=>{
    const added=await vendor.call('POST',`/api/vendor/venues/${id}/team`,{email:'staff@example.test',permission:'RESPONDER'});
    assert.equal(added.status,200);
    assert.equal((await staff.call('GET',`/api/vendor/venues/${id}/availability`)).status,404);
    assert.equal((await staff.call('POST',`/api/vendor/venues/${id}`,{...data,version})).status,404);
    const slot={spaceId:'main',date:`${Number(today().slice(0,4))+1}-10-20`,session:'evening',blocked:true,reason:'PRIVATE_EVENT',version:0};
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}/availability`,slot)).status,200);
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}/availability`,slot)).status,409);
    const inquiry={venueId:id,spaceId:'main',packageId:'essential',date:slot.date,session:'evening',guests:100,event:'wedding'};
    assert.equal((await customer.call('POST','/api/requests',inquiry)).data.error.code,'DATE_BLOCKED');
    const publicSlot=(await guest.call('GET','/api/venues')).data.items.find(v=>v.id===id).availability[0];
    assert.equal(publicSlot.reason,undefined);assert.equal(publicSlot.actor,undefined);
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}/availability`,{...slot,blocked:false,version:1})).status,200);
    const sent=await customer.call('POST','/api/requests',inquiry);assert.equal(sent.status,201);request=sent.data.request;
    assert.equal(request.snapshot.package.price,100000);
    assert.equal(db.prepare('SELECT count(*) AS n FROM availability_history').get().n,2);
  });
  await t.test('private idempotent conversations, notifications and owner-scoped responses',async()=>{
    const path=`/api/requests/${request.id}/messages`,message={text:'Can we bring our own flowers?',nonce:randomUUID()};
    assert.equal((await other.call('GET',path)).status,404);
    assert.equal((await guest.call('GET',path)).status,404);
    assert.equal((await customer.call('POST',path,message)).status,200);
    assert.equal((await customer.call('POST',path,message)).status,200);
    assert.equal((await staff.call('GET',path)).data.items.length,1);
    assert.equal((await staff.call('POST',path,{text:'Yes. We can discuss the details here.',nonce:randomUUID()})).status,200);
    assert.equal((await customer.call('GET',path)).data.items.length,2);
    const notifications=(await customer.call('GET','/api/notifications')).data.items;
    assert.ok(notifications.some(n=>n.kind==='MESSAGE_NEW'));
    assert.equal((await other.call('POST','/api/notifications/read',{id:notifications[0].id})).status,404);
    const reply=await staff.call('POST',`/api/vendor/venues/${id}/requests/${request.id}/responses`,{status:'OFFERED',version:0,price:110000});
    assert.equal(reply.status,200);assert.equal(reply.data.request.status,'OFFERED');
    assert.equal((await customer.call('GET',`/api/requests/${request.id}/history`)).data.items.length,2);
    const member=(await vendor.call('GET',`/api/vendor/venues/${id}/team`)).data.members[0];
    await vendor.call('POST',`/api/vendor/venues/${id}/team/${member.id}`,{action:'remove',version:member.version});
    assert.equal((await staff.call('GET',path)).status,404);
    assert.equal((await staff.call('GET','/api/vendor/requests')).data.items.length,0);
  });
  await t.test('published edits retain live content and historical inquiry prices',async()=>{
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}`,{...data,spaces:data.spaces.slice(1),version})).data.error.code,'INQUIRY_DEPENDENCY');
    const edited={...data,media:[],packages:data.packages.map(p=>({...p,price:p.price+10000})),version};
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}`,edited)).status,200);
    assert.equal((await guest.call('GET','/api/venues')).data.items.find(v=>v.id===id).packages[0].price,100000);
    assert.equal((await guest.call('GET',`/api/media/${photoId}`)).status,200);
    assert.equal((await admin.call('POST',`/api/admin/venues/${id}/reviews`,{decision:'APPROVED',version:version+1,note:''})).status,200);
    assert.equal((await guest.call('GET',`/api/media/${photoId}`)).status,404);
    assert.equal((await customer.call('GET','/api/requests')).data.items.find(r=>r.id===request.id).snapshot.package.price,100000);
    assert.ok(searchVenues({area:'all',date:'',guests:'any',budget:'250000+'}).every(v=>Math.min(...v.packages.map(p=>p.price))>250000));
  });
  await t.test('paused spaces reject new inquiries while existing history remains readable',async()=>{
    const current=(await vendor.call('GET','/api/vendor/venues')).data.items.find(v=>v.id===id);
    const edited={...data,media:[],version:current.version,spaces:data.spaces.map(s=>({...s,enabled:false}))};
    assert.equal((await vendor.call('POST',`/api/vendor/venues/${id}`,edited)).status,200);
    assert.equal((await admin.call('POST',`/api/admin/venues/${id}/reviews`,{decision:'APPROVED',version:current.version+1,note:''})).status,200);
    assert.equal((await customer.call('GET','/api/requests')).status,200);
    assert.equal((await customer.call('POST','/api/requests',{venueId:id,spaceId:'main',packageId:'essential',date:`${Number(today().slice(0,4))+1}-10-21`,session:'evening',guests:100,event:'wedding'})).status,422);
    assert.equal(searchVenues({area:'all',date:'',guests:'any',budget:'any'}).some(v=>v.id===id),false);
  });
  await t.test('support isolation, review conflicts and audit trail',async()=>{
    const ticket=await customer.call('POST','/api/support',{category:'INQUIRY',text:'Please help with my inquiry.'});assert.equal(ticket.status,201);
    assert.deepEqual((await other.call('GET','/api/support')).data.items,[]);
    assert.equal((await other.call('GET','/api/admin/support')).status,403);
    const path=`/api/admin/support/${ticket.data.id}`;
    const reply={reply:'We have reviewed this local test inquiry.',status:'CLOSED',version:0};
    assert.equal((await admin.call('POST',path,reply)).status,200);
    assert.equal((await admin.call('POST',path,reply)).status,409);
    assert.equal((await customer.call('GET','/api/support')).data.items[0].status,'CLOSED');
    assert.equal(db.prepare('SELECT count(*) AS n FROM support_history').get().n,1);
  });
  await t.test('verification, recovery links and session invalidation',async()=>{
    assert.equal((await customer.call('POST','/api/account/verification/request',{})).status,200);
    assert.equal((await other.call('GET','/api/account/mail-preview')).data.items.length,0);
    const verify=(await customer.call('GET','/api/account/mail-preview')).data.items[0];
    const token=new URLSearchParams(verify.url.split('?')[1]).get('token');
    assert.equal((await customer.call('POST','/api/account/verification/confirm',{token})).status,200);
    assert.equal((await customer.call('POST','/api/account/verification/confirm',{token})).status,422);
    const expected=(await guest.call('POST','/api/auth/recovery/request',{email:'couple@example.test'})).data;
    assert.deepEqual((await guest.call('POST','/api/auth/recovery/request',{email:'missing@example.test'})).data,expected);
    const reset=(await customer.call('GET','/api/account/mail-preview')).data.items[0];
    const resetToken=new URLSearchParams(reset.url.split('?')[1]).get('token');
    const stale=client(db);stale.auth.cookie=customer.auth.cookie;
    assert.equal((await guest.call('POST','/api/auth/recovery/complete',{token:resetToken,password:'A-different-test-password-2035'})).status,200);
    assert.equal((await stale.call('GET','/api/requests')).status,401);
    assert.equal((await guest.call('POST','/api/auth/recovery/complete',{token:resetToken,password})).status,422);
    assert.equal((await guest.call('GET','/api/account/mail-preview')).status,401);
  });
});
