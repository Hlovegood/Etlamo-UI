import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { venues } from '../src/data.js';
import { notify, notifyVenue } from './notifications.mjs';
import { requestFingerprint } from '../src/domain.js';

export function openDatabase(path) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode:0o700 });
  const db = new DatabaseSync(path);
  if(path!==':memory:')chmodSync(path,0o600);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS venues (id TEXT PRIMARY KEY, data TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES sessions(id), fingerprint TEXT NOT NULL,
      data TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('DRAFT','PENDING','OFFERED','DECLINED')),
      version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, response TEXT,
      UNIQUE(owner,fingerprint)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS requests_owner ON requests(owner,created_at);
    CREATE TABLE IF NOT EXISTS request_history (
      id INTEGER PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
      status TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('customer','vendor')), request_owner TEXT NOT NULL UNIQUE REFERENCES sessions(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS venue_submissions (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES accounts(id), data TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','CHANGES')), created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS auth_limits (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, resets INTEGER NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS venue_review_history (
      id INTEGER PRIMARY KEY, venue_id TEXT NOT NULL REFERENCES venue_submissions(id),
      reviewer TEXT REFERENCES accounts(id), decision TEXT NOT NULL, reason TEXT,
      note TEXT NOT NULL, version INTEGER NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS venue_team (
      id TEXT PRIMARY KEY, venue_id TEXT NOT NULL REFERENCES venue_submissions(id),
      account_id TEXT NOT NULL REFERENCES accounts(id),
      permission TEXT NOT NULL CHECK(permission IN ('EDITOR','RESPONDER','BOTH')),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, UNIQUE(venue_id,account_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS venue_team_history (
      id INTEGER PRIMARY KEY, member_id TEXT NOT NULL REFERENCES venue_team(id),
      actor TEXT NOT NULL REFERENCES accounts(id), action TEXT NOT NULL,
      permission TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
      kind TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, read_at TEXT
    ) STRICT;
    CREATE INDEX IF NOT EXISTS notifications_account ON notifications(account_id,created_at);
    CREATE TABLE IF NOT EXISTS account_tokens (
      token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
      purpose TEXT NOT NULL CHECK(purpose IN ('VERIFY','RESET')), expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
    ) STRICT;
    CREATE TABLE IF NOT EXISTS mail_preview (
      id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id),
      purpose TEXT NOT NULL, url TEXT NOT NULL, expires INTEGER NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS favorites (
      account_id TEXT NOT NULL REFERENCES accounts(id), venue_id TEXT NOT NULL REFERENCES venues(id),
      PRIMARY KEY(account_id,venue_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS venue_media (
      id TEXT PRIMARY KEY, venue_id TEXT NOT NULL REFERENCES venue_submissions(id),
      type TEXT NOT NULL, bytes BLOB NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS availability (
      venue_id TEXT NOT NULL REFERENCES venue_submissions(id), space_id TEXT NOT NULL, date TEXT NOT NULL,
      session TEXT NOT NULL, blocked INTEGER NOT NULL, reason TEXT NOT NULL,
      version INTEGER NOT NULL, updated_at TEXT NOT NULL,
      PRIMARY KEY(venue_id,space_id,date,session)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS availability_history (
      id INTEGER PRIMARY KEY, venue_id TEXT NOT NULL, space_id TEXT NOT NULL, date TEXT NOT NULL,
      session TEXT NOT NULL, blocked INTEGER NOT NULL, reason TEXT NOT NULL,
      actor TEXT NOT NULL REFERENCES accounts(id), created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS inquiry_messages (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), sender TEXT NOT NULL,
      kind TEXT NOT NULL, text TEXT NOT NULL, nonce TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(request_id,sender,nonce)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), category TEXT NOT NULL,
      text TEXT NOT NULL, reply TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'OPEN',
      version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS support_history (
      id INTEGER PRIMARY KEY, ticket_id TEXT NOT NULL REFERENCES support_tickets(id),
      actor TEXT NOT NULL REFERENCES accounts(id), status TEXT NOT NULL, reply TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS event_plans (
      id TEXT PRIMARY KEY, account_id TEXT NOT NULL REFERENCES accounts(id), data TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS event_plans_account ON event_plans(account_id,updated_at);
    CREATE TABLE IF NOT EXISTS event_plan_media (
      id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES event_plans(id),
      type TEXT NOT NULL, bytes BLOB NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS event_plan_media_plan ON event_plan_media(plan_id);
    CREATE TABLE IF NOT EXISTS event_plan_members (
      id TEXT PRIMARY KEY, plan_id TEXT NOT NULL REFERENCES event_plans(id),
      account_id TEXT NOT NULL REFERENCES accounts(id), permission TEXT NOT NULL CHECK(permission IN ('VIEW','EDIT')),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, UNIQUE(plan_id,account_id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS event_plan_members_account ON event_plan_members(account_id,active);
    CREATE TABLE IF NOT EXISTS provider_submissions (
      id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES accounts(id), data TEXT NOT NULL,
      published TEXT, status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','CHANGES')),
      review_note TEXT NOT NULL DEFAULT '', version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS provider_inquiries (
      id TEXT PRIMARY KEY, provider_id TEXT NOT NULL REFERENCES provider_submissions(id),
      customer_id TEXT NOT NULL REFERENCES accounts(id), data TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('PENDING','OFFERED','DECLINED')),
      quote INTEGER, version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS provider_inquiries_customer ON provider_inquiries(customer_id,created_at);
    CREATE TABLE IF NOT EXISTS provider_media (
      id TEXT PRIMARY KEY, provider_id TEXT NOT NULL REFERENCES provider_submissions(id),
      type TEXT NOT NULL, bytes BLOB NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS provider_media_provider ON provider_media(provider_id);
    PRAGMA user_version=10;`);
  if (!db.prepare('PRAGMA table_info(sessions)').all().some(column=>column.name==='user_id')) db.exec('ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES accounts(id)');
  if (!db.prepare('PRAGMA table_info(accounts)').all().some(column=>column.name==='is_admin')) db.exec('ALTER TABLE accounts ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0 CHECK(is_admin IN (0,1))');
  if (!db.prepare('PRAGMA table_info(venue_submissions)').all().some(column=>column.name==='version')) db.exec('ALTER TABLE venue_submissions ADD COLUMN version INTEGER NOT NULL DEFAULT 0');
  if (!db.prepare('PRAGMA table_info(accounts)').all().some(column=>column.name==='email_verified')) db.exec('ALTER TABLE accounts ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0,1))');
  const seed = db.prepare('INSERT OR IGNORE INTO venues (id,data) VALUES (?,?)');
  for (const venue of venues.filter(item=>item.isSample!==false)) seed.run(venue.id, JSON.stringify(venue));
  // Shared validation now reads the authoritative persisted catalog.
  reloadCatalog(db);
  return db;
}
export function reloadCatalog(db) {
  venues.splice(0,venues.length,...db.prepare('SELECT data FROM venues ORDER BY rowid').all().map(row=>JSON.parse(row.data)));
}
export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result = action(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function publicRequest(row) {
  return { ...JSON.parse(row.data), id: row.id, createdAt: row.created_at, status: row.status, version: row.version, response: row.response ? JSON.parse(row.response) : null };
}
export function createRequest(db, owner, details, status = 'PENDING') {
  return transaction(db, () => {
    const venue=venues.find(item=>item.id===details.venueId);
    details={...details,snapshot:{name:venue.name,area:venue.area,space:venue.spaces.find(item=>item.id===details.spaceId),package:venue.packages.find(item=>item.id===details.packageId)}};
    const id = randomUUID(), createdAt = new Date().toISOString();
    const fingerprint = requestFingerprint(details);
    const result = db.prepare('INSERT OR IGNORE INTO requests (id,owner,fingerprint,data,status,created_at) VALUES (?,?,?,?,?,?)').run(id,owner,fingerprint,JSON.stringify(details),status,createdAt);
    let row = db.prepare('SELECT * FROM requests WHERE owner=? AND fingerprint=?').get(owner,fingerprint);
    if (!result.changes && status === 'PENDING' && row.status === 'DRAFT') {
      db.prepare("UPDATE requests SET status='PENDING',version=version+1 WHERE id=?").run(row.id);
      row = db.prepare('SELECT * FROM requests WHERE id=?').get(row.id);
      db.prepare('INSERT INTO request_history (request_id,status,data,created_at) VALUES (?,?,?,?)').run(row.id,'PENDING','{}',createdAt);
      notifyVenue(db,details.venueId,'INQUIRY_NEW',{venueId:details.venueId},'reply');
      return { request: publicRequest(row), duplicate: false };
    }
    if (result.changes) {
      db.prepare('INSERT INTO request_history (request_id,status,data,created_at) VALUES (?,?,?,?)').run(row.id,status,'{}',createdAt);
      if(status==='PENDING')notifyVenue(db,details.venueId,'INQUIRY_NEW',{venueId:details.venueId},'reply');
    }
    return { request: publicRequest(row), duplicate: !result.changes };
  });
}
export function respond(db, owner, venueId, requestId, input) {
  return transaction(db, () => {
    const row = db.prepare('SELECT * FROM requests WHERE owner=? AND id=?').get(owner,requestId);
    if (!row || JSON.parse(row.data).venueId !== venueId) return { error: 'NOT_FOUND' };
    if (row.status !== 'PENDING' || row.version !== input.version) return { error: 'CONFLICT' };
    const response = { status: input.status, price: input.status === 'OFFERED' ? input.price : null, reason: input.status === 'DECLINED' ? input.reason : null, createdAt: new Date().toISOString() };
    db.prepare('UPDATE requests SET status=?,response=?,version=version+1 WHERE id=? AND version=?').run(input.status,JSON.stringify(response),requestId,input.version);
    db.prepare('INSERT INTO request_history (request_id,status,data,created_at) VALUES (?,?,?,?)').run(requestId,input.status,JSON.stringify(response),response.createdAt);
    const customer=db.prepare('SELECT id FROM accounts WHERE request_owner=?').get(row.owner);
    if(customer)notify(db,customer.id,'INQUIRY_REPLY',{venueId});
    return { request: publicRequest(db.prepare('SELECT * FROM requests WHERE id=?').get(requestId)) };
  });
}
