import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../server/database.mjs';
import { client } from './client.mjs';

const draft={venueId:'olive-garden',spaceId:'garden',packageId:'essential',guests:200,event:'wedding',session:'evening',date:'2035-10-20'};

test('anonymous sessions are bounded and expired unreferenced rows are pruned',async()=>{
  const db=openDatabase(':memory:');
  try{
    db.prepare('INSERT INTO sessions (id,csrf,expires) VALUES (?,?,?)').run('e'.repeat(64),'f'.repeat(64),0);
    const guest=client(db);
    for(let i=0;i<60;i++){
      guest.auth.cookie='';
      assert.equal((await guest.call('GET','/api/session')).status,200);
    }
    guest.auth.cookie='';
    assert.equal((await guest.call('GET','/api/session')).status,429);
    assert.equal(db.prepare('SELECT count(*) AS n FROM sessions').get().n,60);
    db.prepare('UPDATE auth_limits SET resets=0').run();
    assert.equal((await guest.call('GET','/api/session')).status,200);
  }finally{db.close();}
});

test('persistent request and demo venue API', async t=>{
  const directory=mkdtempSync(join(tmpdir(),'weddo-api-'));
  const path=join(directory,'test.sqlite');
  let db=openDatabase(path);
  t.after(()=>{db.close();rmSync(directory,{recursive:true,force:true});});
  const alice=client(db),bob=client(db);
  await alice.call('GET','/api/session');await bob.call('GET','/api/session');
  let request;
  await t.test('sessions are HttpOnly, protected from cross-origin mutations',async()=>{
    const fresh=await client(db).call('GET','/api/session');
    assert.match(fresh.headers['Set-Cookie'],/HttpOnly; SameSite=Strict/);
    assert.equal((await alice.call('POST','/api/requests',draft,{origin:'https://untrusted.example'})).status,403);
    assert.equal((await alice.call('POST','/api/requests',draft,{'x-csrf-token':''})).status,403);
    assert.equal((await client(db).call('GET','/api/requests')).status,401);
    assert.equal(db.prepare('SELECT * FROM sessions WHERE id=?').get(alice.auth.cookie.split('=')[1]),undefined);
  });
  await t.test('validates exact space capacity, dates, and input fields',async()=>{
    assert.equal((await alice.call('POST','/api/requests',{...draft,guests:300})).data.error.code,'CAPACITY_EXCEEDED');
    assert.equal((await alice.call('POST','/api/requests',{...draft,date:'2035-02-30'})).data.error.code,'INVALID_DATE');
    assert.equal((await alice.call('POST','/api/requests',{...draft,date:'2000-01-01'})).status,422);
    assert.equal((await alice.call('POST','/api/requests',{...draft,packageId:'invented'})).status,422);
    assert.equal((await alice.call('POST','/api/requests','{bad json')).status,400);
    assert.equal((await alice.call('POST','/api/requests','x'.repeat(65537))).status,413);
  });
  await t.test('creates pending requests, ignores privileged client fields, and replays duplicates',async()=>{
    const result=await alice.call('POST','/api/requests',{...draft,status:'CONFIRMED',owner:'fake',price:1});
    assert.equal(result.status,201);request=result.data.request;
    assert.equal(request.status,'PENDING');assert.equal(request.owner,undefined);assert.equal(request.price,undefined);
    const duplicate=await alice.call('POST','/api/requests',draft);
    assert.equal(duplicate.status,200);assert.equal(duplicate.data.duplicate,true);assert.equal(duplicate.data.request.id,request.id);
    assert.equal(db.prepare('SELECT count(*) AS n FROM requests').get().n,1);
  });
  await t.test('isolates customer and demo venue queues by ownership and venue',async()=>{
    assert.equal((await bob.call('GET','/api/requests')).data.items.length,0);
    assert.equal((await alice.call('GET','/api/demo/venues/olive-garden/requests')).data.items.length,1);
    assert.equal((await bob.call('GET','/api/demo/venues/olive-garden/requests')).data.items.length,0);
    assert.equal((await alice.call('GET','/api/demo/venues/nile-salon/requests')).data.items.length,0);
    assert.equal((await bob.call('POST',`/api/demo/venues/olive-garden/requests/${request.id}/responses`,{status:'OFFERED',price:120000,version:0})).status,404);
    assert.equal((await alice.call('POST',`/api/demo/venues/nile-salon/requests/${request.id}/responses`,{status:'OFFERED',price:120000,version:0})).status,404);
  });
  await t.test('offers update customer state atomically and stale replies conflict',async()=>{
    const route=`/api/demo/venues/olive-garden/requests/${request.id}/responses`;
    assert.equal((await alice.call('POST',route,{status:'CONFIRMED',version:0})).status,422);
    assert.equal((await alice.call('POST',route,{status:'OFFERED',price:-1,version:0})).status,422);
    const reply=await alice.call('POST',route,{status:'OFFERED',price:120000,version:0});
    assert.equal(reply.status,200);assert.equal(reply.data.request.status,'OFFERED');assert.equal(reply.data.request.version,1);
    assert.equal((await alice.call('GET','/api/requests')).data.items[0].response.price,120000);
    assert.equal((await alice.call('POST',route,{status:'DECLINED',reason:'DATE_UNAVAILABLE',version:0})).status,409);
    assert.equal(db.prepare('SELECT count(*) AS n FROM request_history WHERE request_id=?').get(request.id).n,2);
  });
  await t.test('legacy imports remain drafts, repeated imports preserve responses, and explicit submission promotes a draft',async()=>{
    const old={...draft,date:'2000-10-20'};
    const future={...draft,date:'2035-10-21'};
    const imported=await alice.call('POST','/api/requests/imports',{requests:[old,future,draft,{bad:'input'}]});
    assert.equal(imported.data.imported,3);assert.equal(imported.data.rejected,1);
    const items=(await alice.call('GET','/api/requests')).data.items;
    assert.equal(items.find(r=>r.date===old.date).status,'DRAFT');
    assert.equal(items.find(r=>r.id===request.id).status,'OFFERED');
    const promotion=await alice.call('POST','/api/requests',future);
    assert.equal(promotion.data.request.status,'PENDING');assert.equal(promotion.data.duplicate,false);
    assert.equal((await alice.call('POST',`/api/demo/venues/olive-garden/requests/${promotion.data.request.id}/responses`,{status:'DECLINED',reason:'DATE_UNAVAILABLE',version:1})).data.request.status,'DECLINED');
  });
  await t.test('paginated inventory and request lists enforce bounds',async()=>{
    const page=(await alice.call('GET','/api/venues?limit=1&offset=0')).data;
    assert.equal(page.items.length,1);assert.equal(page.nextOffset,1);
    assert.equal((await alice.call('GET','/api/requests?limit=1')).data.items.length,1);
    assert.equal((await alice.call('GET','/api/venues?limit=0')).status,400);
    assert.equal((await alice.call('GET','/api/venues?offset=-1')).status,400);
  });
  await t.test('database and cookie ownership survive a server restart',async()=>{
    const cookie=alice.auth.cookie;db.close();db=openDatabase(path);
    const restarted=client(db);restarted.auth.cookie=cookie;
    const list=await restarted.call('GET','/api/requests');
    assert.equal(list.status,200);assert.equal(list.data.items.find(r=>r.id===request.id).status,'OFFERED');
  });
});
