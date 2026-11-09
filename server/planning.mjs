import { randomUUID } from 'node:crypto';
import { transaction } from './database.mjs';
import { notify } from './notifications.mjs';
import { readPhotoBytes } from './marketplace.mjs';

const uuid = value => typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
const date = value => value === '' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) === value);
const withDefaults=(value,fields)=>Array.isArray(value)?value.map(item=>item&&typeof item==='object'?{...fields,...item}:item):value??[];
const defaults = data => ({...data,budget:data.budget??0,expenses:withDefaults(data.expenses,{category:'Other',kind:'expense',due:''}),tasks:withDefaults(data.tasks,{category:'',assignee:''}),shopping:data.shopping??[],schedule:withDefaults(data.schedule,{duration:30,person:''}),links:data.links??[],features:data.features??[],floorPlan:data.floorPlan??null,ceremony:data.ceremony??{rows:8,seatsPerSide:8,partyLeft:6,partyRight:6,blocked:[],assignments:{}},guests:data.guests.map(g=>({group:'',rsvp:'pending',meal:'none',email:'',phone:'',address:'',dietary:'',notes:'',...g}))});
const publicPlan = (row,access='OWNER') => ({ id:row.id, ...defaults(JSON.parse(row.data)), version:row.version, updatedAt:row.updated_at,access });
const planAccess=(db,row,accountId)=>row.account_id===accountId?'OWNER':db.prepare('SELECT permission FROM event_plan_members WHERE plan_id=? AND account_id=? AND active=1').get(row.id,accountId)?.permission;
const members=(db,id)=>db.prepare('SELECT m.id,a.email,m.permission,m.version FROM event_plan_members m JOIN accounts a ON a.id=m.account_id WHERE m.plan_id=? AND m.active=1 ORDER BY m.created_at,m.id').all(id);
function planInquiries(db,ownerId) {
  const account=db.prepare('SELECT request_owner FROM accounts WHERE id=?').get(ownerId);
  const venues=db.prepare('SELECT id,data,status,response FROM requests WHERE owner=? ORDER BY created_at DESC').all(account.request_owner).map(row=>{
    const data=JSON.parse(row.data),response=row.response?JSON.parse(row.response):null;
    const listing=db.prepare('SELECT data FROM venues WHERE id=?').get(data.venueId);
    const catalog=listing?JSON.parse(listing.data):null;
    return {kind:'venue',id:row.id,name:data.snapshot?.name||catalog?.name||{en:'Venue',ar:'قاعة'},packageName:data.snapshot?.package?.name||catalog?.packages?.find(item=>item.id===data.packageId)?.name||null,date:data.date,status:row.status,quote:response?.price??null};
  });
  const services=db.prepare('SELECT id,data,status,quote FROM provider_inquiries WHERE customer_id=? ORDER BY created_at DESC LIMIT 200').all(ownerId).map(row=>{
    const data=JSON.parse(row.data);
    return {kind:'service',id:row.id,name:data.providerName,packageName:data.packageName,date:data.date,status:row.status,quote:row.quote};
  });
  return [...venues,...services];
}

function validate(input, ErrorType) {
  const invalid = () => { throw new ErrorType(422,'INVALID_PLAN','Check the event, guests and tables.'); };
  if (!text(input.name, 100) || !['wedding','conference','other'].includes(input.type) || !date(input.date) || !Array.isArray(input.guests) || input.guests.length > 500 || !Array.isArray(input.tables) || input.tables.length > 80) invalid();
  const plan=defaults(input);
  if(!Number.isSafeInteger(plan.budget)||plan.budget<0||plan.budget>1000000000)invalid();
  const lists=[['expenses',100],['tasks',200],['shopping',200],['schedule',100]];
  for(const [key,max] of lists){
    if(!Array.isArray(plan[key])||plan[key].length>max)invalid();
    const ids=new Set();
    for(const item of plan[key]){
      if(!item||!uuid(item.id)||ids.has(item.id)||!text(item.title,120))invalid();
      ids.add(item.id);
      if(key==='expenses'&&(!Number.isSafeInteger(item.amount)||item.amount<0||item.amount>1000000000||typeof item.paid!=='boolean'||!['Venue','Catering','Photography','Decor','Music','Outfits','Other'].includes(item.category)||!['expense','purchase','invoice'].includes(item.kind)||!date(item.due)))invalid();
      if(key==='tasks'&&(!date(item.due)||typeof item.done!=='boolean'||typeof item.category!=='string'||item.category.length>60||typeof item.assignee!=='string'||item.assignee.length>100))invalid();
      if(key==='shopping'&&(!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>999||typeof item.done!=='boolean'))invalid();
      if(key==='schedule'&&(!date(item.date)||item.date===''||typeof item.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)||!Number.isInteger(item.duration)||item.duration<5||item.duration>720||typeof item.person!=='string'||item.person.length>100))invalid();
    }
  }
  const guestIds = new Set();
  for (const guest of plan.guests) {
    if (!guest || !uuid(guest.id) || guestIds.has(guest.id) || !text(guest.name, 100) || typeof guest.group!=='string' || guest.group.length>60 || !['pending','yes','no'].includes(guest.rsvp) || !['none','standard','vegetarian','vegan','other'].includes(guest.meal)||['email','phone','address','dietary','notes'].some(key=>typeof guest[key]!=='string'||guest[key].length>({email:254,phone:40,address:240,dietary:120,notes:500}[key]))) invalid();
    guestIds.add(guest.id);
  }
  const tableIds = new Set(), assigned = new Set();
  for (const table of input.tables) {
    if (!table || !uuid(table.id) || tableIds.has(table.id) || !['round','rect','long','square','sweetheart','serpentine'].includes(table.shape) || !text(table.label, 30) || !Number.isInteger(table.x) || table.x < 55 || table.x > 945 || !Number.isInteger(table.y) || table.y < 55 || table.y > 645 || !Number.isInteger(table.seats) || table.seats < 2 || table.seats > 20 || !Array.isArray(table.assignments) || table.assignments.length !== table.seats || (table.widthInches!==undefined&&(!Number.isInteger(table.widthInches)||table.widthInches<24||table.widthInches>240)) || (table.depthInches!==undefined&&(!Number.isInteger(table.depthInches)||table.depthInches<24||table.depthInches>120))) invalid();
    tableIds.add(table.id);
    for (const id of table.assignments) {
      if (id === null) continue;
      if (!guestIds.has(id) || plan.guests.find(g=>g.id===id)?.rsvp==='no' || assigned.has(id)) invalid();
      assigned.add(id);
    }
  }
  if(!Array.isArray(plan.features)||plan.features.length>30)invalid();
  const featureIds=new Set();
  for(const item of plan.features){
    if(!item||!uuid(item.id)||featureIds.has(item.id)||!['stage','dance','buffet','entrance','aisle','screen'].includes(item.kind)||typeof item.label!=='string'||item.label.length>40||![item.x,item.y,item.width,item.height].every(Number.isInteger)||item.width<40||item.width>250||item.height<40||item.height>200||item.x<item.width/2||item.x>1000-item.width/2||item.y<item.height/2||item.y>700-item.height/2)invalid();
    featureIds.add(item.id);
  }
  if(!Array.isArray(plan.links)||plan.links.length>30||plan.links.some(link=>!link||!['venue','service'].includes(link.kind)||!uuid(link.id))||new Set(plan.links.map(link=>`${link.kind}:${link.id}`)).size!==plan.links.length)invalid();
  const ceremony=plan.ceremony;
  if(!ceremony||![ceremony.rows,ceremony.seatsPerSide,ceremony.partyLeft,ceremony.partyRight].every(Number.isInteger)||ceremony.rows<1||ceremony.rows>16||ceremony.seatsPerSide<1||ceremony.seatsPerSide>12||ceremony.partyLeft<0||ceremony.partyLeft>12||ceremony.partyRight<0||ceremony.partyRight>12||!Array.isArray(ceremony.blocked)||!ceremony.assignments||typeof ceremony.assignments!=='object'||Array.isArray(ceremony.assignments))invalid();
  const validCeremonySeat=key=>{const match=/^(L|R)-(\d+)-(\d+)$/.exec(key);if(match)return Number(match[2])<ceremony.rows&&Number(match[3])<ceremony.seatsPerSide;const party=/^(PL|PR)-(\d+)$/.exec(key);return party&&Number(party[2])<(party[1]==='PL'?ceremony.partyLeft:ceremony.partyRight);};
  if(ceremony.blocked.length>400||new Set(ceremony.blocked).size!==ceremony.blocked.length||ceremony.blocked.some(key=>typeof key!=='string'||!validCeremonySeat(key)))invalid();
  const ceremonyGuests=new Set();
  for(const [key,id] of Object.entries(ceremony.assignments)){if(!validCeremonySeat(key)||ceremony.blocked.includes(key)||!guestIds.has(id)||plan.guests.find(g=>g.id===id)?.rsvp==='no'||ceremonyGuests.has(id))invalid();ceremonyGuests.add(id);}
  const floor=plan.floorPlan;
  if(floor!==null&&(!floor||!uuid(floor.id)||!Array.isArray(floor.points)||floor.points.length!==2||floor.points.some(p=>!p||![p.x,p.y].every(Number.isInteger)||p.x<0||p.x>1000||p.y<0||p.y>700)||typeof floor.meters!=='number'||!Number.isFinite(floor.meters)||floor.meters<0||floor.meters>1000||floor.meters>0&&Math.hypot(floor.points[0].x-floor.points[1].x,floor.points[0].y-floor.points[1].y)<2))invalid();
  return { name:input.name.trim(), type:input.type, date:input.date, budget:plan.budget,expenses:plan.expenses.map(x=>({id:x.id,title:x.title.trim(),amount:x.amount,paid:x.paid,category:x.category,kind:x.kind,due:x.due})),tasks:plan.tasks.map(x=>({id:x.id,title:x.title.trim(),due:x.due,done:x.done,category:x.category.trim(),assignee:x.assignee.trim()})),shopping:plan.shopping.map(x=>({id:x.id,title:x.title.trim(),quantity:x.quantity,done:x.done})),schedule:plan.schedule.map(x=>({id:x.id,title:x.title.trim(),date:x.date,time:x.time,duration:x.duration,person:x.person.trim()})),links:plan.links.map(link=>({kind:link.kind,id:link.id})),guests:plan.guests.map(g => ({ id:g.id, name:g.name.trim(),group:g.group.trim(),rsvp:g.rsvp,meal:g.meal,email:g.email.trim(),phone:g.phone.trim(),address:g.address.trim(),dietary:g.dietary.trim(),notes:g.notes.trim() })), tables:input.tables.map(t => ({ id:t.id, label:t.label.trim(), shape:t.shape, x:t.x, y:t.y, seats:t.seats, assignments:t.assignments,widthInches:t.widthInches,depthInches:t.depthInches })),features:plan.features.map(f=>({id:f.id,kind:f.kind,label:f.label.trim(),x:f.x,y:f.y,width:f.width,height:f.height})),floorPlan:floor?{id:floor.id,points:floor.points.map(p=>({x:p.x,y:p.y})),meters:floor.meters}:null,ceremony:{rows:ceremony.rows,seatsPerSide:ceremony.seatsPerSide,partyLeft:ceremony.partyLeft,partyRight:ceremony.partyRight,blocked:ceremony.blocked,assignments:ceremony.assignments} };
}

export async function planningApi(db, req, res, url, { account, body, ErrorType, json }) {
  const path=url.pathname;
  if (!path.startsWith('/api/plans')) return false;
  if (!account) throw new ErrorType(401,'ACCOUNT_REQUIRED','Sign in to plan an event.');
  if (req.method === 'GET' && path === '/api/plans') {
    const rows=db.prepare("SELECT p.*,CASE WHEN p.account_id=? THEN 'OWNER' ELSE m.permission END AS access FROM event_plans p LEFT JOIN event_plan_members m ON m.plan_id=p.id AND m.account_id=? AND m.active=1 WHERE p.account_id=? OR m.id IS NOT NULL ORDER BY p.updated_at DESC,p.id DESC LIMIT 100").all(account.id,account.id,account.id);
    json(res,200,{items:rows.map(row=>publicPlan(row,row.access))});return true;
  }
  if (req.method === 'POST' && path === '/api/plans') {
    const input=await body(req),data=validate({ ...input, guests:[], tables:[] },ErrorType);
    const plan=transaction(db,()=>{
      if(db.prepare('SELECT count(*) AS n FROM event_plans WHERE account_id=?').get(account.id).n>=20)throw new ErrorType(409,'PLAN_LIMIT','Keep up to 20 events.');
      const id=randomUUID(),now=new Date().toISOString();
      db.prepare('INSERT INTO event_plans (id,account_id,data,created_at,updated_at) VALUES (?,?,?,?,?)').run(id,account.id,JSON.stringify(data),now,now);
      return publicPlan(db.prepare('SELECT * FROM event_plans WHERE id=?').get(id));
    });
    json(res,201,{plan});return true;
  }
  const match=path.match(/^\/api\/plans\/([a-f0-9-]{36})(?:\/(members|inquiries|floor-plan)(?:\/([a-f0-9-]{36}))?)?$/);
  if (match) {
    const row=db.prepare('SELECT * FROM event_plans WHERE id=?').get(match[1]),access=row&&planAccess(db,row,account.id);
    if(!access)throw new ErrorType(404,'NOT_FOUND','Event not found.');
    if(match[2]==='floor-plan'){
      if(req.method==='GET'&&match[3]){
        const media=db.prepare('SELECT type,bytes FROM event_plan_media WHERE id=? AND plan_id=?').get(match[3],row.id);
        if(!media||defaults(JSON.parse(row.data)).floorPlan?.id!==match[3])throw new ErrorType(404,'NOT_FOUND','Floor plan not found.');
        res.writeHead(200,{'Content-Type':media.type,'Content-Length':media.bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(media.bytes);return true;
      }
      if(req.method==='POST'&&!match[3]){
        if(access==='VIEW')throw new ErrorType(403,'PLAN_EDIT_REQUIRED','This event is shared as view only.');
        if(db.prepare('SELECT count(*) AS n FROM event_plan_media WHERE plan_id=?').get(row.id).n>=20)throw new ErrorType(422,'PLAN_MEDIA_LIMIT','This event has reached its floor plan upload limit.');
        const {type,bytes}=await readPhotoBytes(req,ErrorType),id=randomUUID();
        db.prepare('INSERT INTO event_plan_media (id,plan_id,type,bytes,created_at) VALUES (?,?,?,?,?)').run(id,row.id,type,bytes,new Date().toISOString());
        json(res,201,{id});return true;
      }
      throw new ErrorType(404,'NOT_FOUND','Planning endpoint not found.');
    }
    if(match[2]==='inquiries' && !match[3] && req.method==='GET'){
      const all=planInquiries(db,row.account_id),links=defaults(JSON.parse(row.data)).links;
      const items=links.map(link=>all.find(item=>item.kind===link.kind&&item.id===link.id)).filter(Boolean);
      json(res,200,{items,options:access==='OWNER'?all:[]});return true;
    }
    if(match[2]==='members'){
      if(access!=='OWNER')throw new ErrorType(403,'PLAN_OWNER_REQUIRED','Only the event owner can manage sharing.');
      if(req.method==='GET'&&!match[3]){json(res,200,{items:members(db,row.id)});return true;}
      if(req.method==='POST'){
        const input=await body(req);
        const result=transaction(db,()=>{
          if(match[3]){
            if(!['update','remove'].includes(input.action)||!Number.isSafeInteger(input.version)||input.version<0||(input.action==='update'&&!['VIEW','EDIT'].includes(input.permission)))throw new ErrorType(422,'INVALID_PLAN_MEMBER','Choose a permission.');
            const member=db.prepare('SELECT * FROM event_plan_members WHERE id=? AND plan_id=? AND active=1').get(match[3],row.id);
            if(!member)throw new ErrorType(404,'NOT_FOUND','Member not found.');
            const result=db.prepare('UPDATE event_plan_members SET active=?,permission=?,version=version+1 WHERE id=? AND version=?').run(input.action==='remove'?0:1,input.action==='remove'?member.permission:input.permission,member.id,input.version);
            if(!result.changes)throw new ErrorType(409,'CONFLICT','Sharing changed. Refresh the list.');
            notify(db,member.account_id,input.action==='remove'?'PLAN_ACCESS_REMOVED':'PLAN_ACCESS_UPDATED',{planId:row.id});
          }else{
            const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
            if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!['VIEW','EDIT'].includes(input.permission))throw new ErrorType(422,'INVALID_PLAN_MEMBER','Enter an existing account email and permission.');
            const invited=db.prepare('SELECT id FROM accounts WHERE email=?').get(email);
            if(!invited||invited.id===account.id)throw new ErrorType(422,'MEMBER_UNAVAILABLE','Choose another registered Weddo account.');
            const previous=db.prepare('SELECT * FROM event_plan_members WHERE plan_id=? AND account_id=?').get(row.id,invited.id);
            if(previous?.active)throw new ErrorType(409,'MEMBER_EXISTS','This account already has access.');
            if(db.prepare('SELECT count(*) AS n FROM event_plan_members WHERE plan_id=? AND active=1').get(row.id).n>=10)throw new ErrorType(422,'MEMBER_LIMIT','Share with up to 10 accounts.');
            if(previous)db.prepare('UPDATE event_plan_members SET active=1,permission=?,version=version+1 WHERE id=?').run(input.permission,previous.id);
            else db.prepare('INSERT INTO event_plan_members (id,plan_id,account_id,permission,created_at) VALUES (?,?,?,?,?)').run(randomUUID(),row.id,invited.id,input.permission,new Date().toISOString());
            notify(db,invited.id,'PLAN_SHARED',{planId:row.id});
          }
          return {items:members(db,row.id)};
        });
        json(res,200,result);return true;
      }
    }
    if(match[2])throw new ErrorType(404,'NOT_FOUND','Planning endpoint not found.');
    if(req.method==='GET'){json(res,200,{plan:publicPlan(row,access)});return true;}
    if(req.method==='POST'){
      if(access==='VIEW')throw new ErrorType(403,'PLAN_EDIT_REQUIRED','This event is shared as view only.');
      const input=await body(req);
      if(!Number.isSafeInteger(input.version) || input.version<0)throw new ErrorType(422,'INVALID_PLAN','Refresh the event and try again.');
      const data=validate(input,ErrorType),now=new Date().toISOString();
      if(data.floorPlan&&!db.prepare('SELECT id FROM event_plan_media WHERE id=? AND plan_id=?').get(data.floorPlan.id,row.id))throw new ErrorType(422,'INVALID_PLAN','Choose a floor plan uploaded to this event.');
      const oldLinks=defaults(JSON.parse(row.data)).links;
      if(access!=='OWNER'&&JSON.stringify(data.links)!==JSON.stringify(oldLinks))throw new ErrorType(403,'PLAN_OWNER_REQUIRED','Only the event owner can link inquiries.');
      if(access==='OWNER'&&data.links.length){
        const owned=new Set(planInquiries(db,row.account_id).map(item=>`${item.kind}:${item.id}`));
        if(data.links.some(link=>!owned.has(`${link.kind}:${link.id}`)))throw new ErrorType(422,'INVALID_PLAN_LINK','Choose one of your own inquiries.');
      }
      const updated=db.prepare('UPDATE event_plans SET data=?,version=version+1,updated_at=? WHERE id=? AND version=?').run(JSON.stringify(data),now,match[1],input.version);
      if(!updated.changes)throw new ErrorType(409,'CONFLICT','This event changed. Refresh it before editing.');
      json(res,200,{plan:publicPlan(db.prepare('SELECT * FROM event_plans WHERE id=?').get(match[1]),access)});return true;
    }
  }
  throw new ErrorType(404,'NOT_FOUND','Planning endpoint not found.');
}
