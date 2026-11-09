import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../server/database.mjs';
import { client } from './client.mjs';
import { seatPositions } from '../src/planning-views.js';

test('event plans save seating and stay private',async t=>{
  const db=openDatabase(':memory:');t.after(()=>db.close());
  const one=client(db),two=client(db),guest=client(db);
  for(const [c,email] of [[one,'planner-one@example.test'],[two,'planner-two@example.test']]) {
    await c.call('GET','/api/session');
    assert.equal((await c.call('POST','/api/auth/register',{email,password:'Local-planner-password-2026',role:'customer'})).status,200);
  }
  await guest.call('GET','/api/session');
  assert.equal((await guest.call('GET','/api/plans')).status,401);
  const made=await one.call('POST','/api/plans',{name:'Our celebration',type:'wedding',date:'2027-03-12'});
  assert.equal(made.status,201);const plan=made.data.plan;
  assert.equal((await two.call('GET',`/api/plans/${plan.id}`)).status,404);
  assert.equal((await two.call('POST',`/api/plans/${plan.id}`,{...plan,version:0})).status,404);
  const person=randomUUID(),tableId=randomUUID();
  const next={...plan,guests:[{id:person,name:'Ahmed'}],tables:[{id:tableId,label:'Family',shape:'round',x:300,y:200,seats:8,assignments:[person,...Array(7).fill(null)]}]};
  assert.equal((await one.call('POST',`/api/plans/${plan.id}`,next)).status,200);
  assert.equal((await one.call('POST',`/api/plans/${plan.id}`,next)).status,409);
  assert.equal((await one.call('POST',`/api/plans/${plan.id}`,{...next,version:1,tables:[next.tables[0],{...next.tables[0],id:randomUUID(),assignments:[person,...Array(7).fill(null)]}]})).status,422);
  assert.equal((await one.call('POST',`/api/plans/${plan.id}`,{...next,version:1,date:'2027-02-30'})).status,422);
  assert.equal((await one.call('GET',`/api/plans/${plan.id}`)).data.plan.tables[0].assignments[0],person);
  assert.equal(seatPositions(next.tables[0]).length,8);
  assert.equal(seatPositions({...next.tables[0],shape:'rect'}).length,8);
});

test('planning tools validate saved budget, task and timeline details',async t=>{
  const db=openDatabase(':memory:');t.after(()=>db.close());
  const user=client(db);await user.call('GET','/api/session');
  assert.equal((await user.call('POST','/api/auth/register',{email:'tools@example.test',password:'Local-planner-password-2026',role:'customer'})).status,200);
  const plan=(await user.call('POST','/api/plans',{name:'Our day',type:'wedding',date:'2027-03-12'})).data.plan;
  const input={...plan,expenses:[{id:randomUUID(),title:'Catering',amount:1000,paid:false,category:'Catering',kind:'invoice',due:'2027-02-01'}],tasks:[{id:randomUUID(),title:'Book photographer',due:'2027-01-01',done:false,category:'Vendors',assignee:'Mona'}],schedule:[{id:randomUUID(),title:'Ceremony',date:'2027-03-12',time:'17:00',duration:60,person:'Celebrant'}]};
  assert.equal((await user.call('POST',`/api/plans/${plan.id}`,input)).status,200);
  const saved=(await user.call('GET',`/api/plans/${plan.id}`)).data.plan;
  assert.equal(saved.expenses[0].category,'Catering');
  assert.equal(saved.tasks[0].assignee,'Mona');
  assert.equal(saved.schedule[0].duration,60);
  assert.equal((await user.call('POST',`/api/plans/${plan.id}`,{...saved,expenses:[{...saved.expenses[0],kind:'<script>'}]})).status,422);
  assert.equal((await user.call('POST',`/api/plans/${plan.id}`,{...saved,expenses:{}})).status,422);
  assert.equal((await user.call('POST',`/api/plans/${plan.id}`,{...saved,schedule:[{...saved.schedule[0],duration:100000}]})).status,422);
});
