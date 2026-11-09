# Local API — v0.15 planner inquiry links

All routes are same-origin under `/api`. This server is a loopback-only local preview. No payment, hold or confirmed-booking endpoint exists.

## Conventions

`GET /api/session` creates/loads a session and returns `{csrfToken,isDemo:true,account}`. Session cookies are HttpOnly/SameSite=Strict. Except public catalog, health and published photos, requests require a session. Mutations require an exact same-origin `Origin` and `X-CSRF-Token`. Authentication rotates both session and CSRF tokens. Tokens are never persisted in browser storage.

JSON requests require `Content-Type: application/json` and an object body. The limit is 64 KiB except plan updates, which allow 512 KiB for large guest lists. Photo uploads use a raster MIME type and at most 5 MiB. Error responses are `{error:{code,message}}`; clients translate error codes. Common statuses: 401 no session/account, 403 permission/origin/CSRF failure, 404 inaccessible/missing resource, 409 stale state, 422 invalid input, 429 attempt limit. Resource reads do not reveal another customer’s private records.

List routes return `{items,nextOffset}` with `?limit=1..50&offset=0..`. Order is stable per route. `/api/favorites`, calendar lists, own mail preview and inquiry history have their own bounded response shapes rather than list pagination.

## Routes

| Method | Route | Access / result |
|---|---|---|
| GET | `/health` | Public `{ok:true,mode:'local-preview'}` after a database check |
| GET | `/venues` | Public published venue catalog, with date blocks and freshness; private reasons/actors excluded |
| GET | `/media/:id` | Public only while referenced in a published listing; otherwise listing editor or admin; raster bytes, no caching |
| GET | `/session` | Guest/account session and CSRF |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | Local identity and rotating session |
| POST | `/account/verification/request` | Account; prepare private local verification message |
| POST | `/account/verification/confirm` | Consume verification token |
| POST | `/auth/recovery/request` | Prepare recovery without revealing whether the email exists |
| POST | `/auth/recovery/complete` | Consume reset token, replace password, invalidate account sessions |
| GET | `/account/mail-preview` | Own account’s unexpired preview links only |
| GET / POST | `/favorites` | Account only; GET `{ids}`, POST `{venueId,saved:boolean}` returns authoritative `{ids}` |
| GET / POST | `/plans` | Account only; list owned and shared plans or create a wedding, conference or other event; at most 20 owned plans |
| GET / POST | `/plans/:id` | Owner or editor may replace plan with current `version`; viewers may read only |
| POST | `/plans/:id/floor-plan` | Owner/editor uploads one JPEG, PNG or WebP image up to 5 MB; returns a private media ID |
| GET | `/plans/:id/floor-plan/:mediaId` | Plan members only; serves the image currently referenced by the plan |
| GET | `/plans/:id/inquiries` | Plan members see linked inquiry summaries; only owner receives their eligible inquiry options |
| GET / POST | `/plans/:id/members` | Owner only; list or invite up to 10 existing accounts with `VIEW` or `EDIT` |
| POST | `/plans/:id/members/:memberId` | Owner only; versioned `update` or `remove` action |
| GET / POST | `/requests` | Own requests / create validated inquiry |
| POST | `/requests/imports` | Up to 100 old local records, imported as unsent drafts |
| GET / POST | `/requests/:id/messages` | Customer owner or venue reply staff; private conversation |
| GET | `/requests/:id/history` | Same permissions; inquiry state/timestamp history |
| GET / POST | `/vendor/venues` | Vendor-accessible listings / create owned pending submission |
| GET | `/providers` | Public approved service listings and packages |
| GET / POST | `/vendor/providers` | Vendor-owned service submissions / create pending service |
| POST | `/vendor/providers/:id` | Owner edits a service with current version; prior approved snapshot stays public |
| POST | `/vendor/providers/:id/photos` | Owner uploads private JPEG/PNG/WebP; returns `{id}`; selected photos publish after review |
| GET | `/admin/providers` | Admin service review queue |
| POST | `/admin/providers/:id/review` | Admin versioned approval or changes request |
| GET / POST | `/provider-inquiries` | Customer inquiries / send one with approved provider and package ID |
| GET | `/vendor/provider-inquiries` | Vendor inquiries for owned services |
| POST | `/vendor/provider-inquiries/:id/reply` | Vendor quote or decline on pending inquiry |
| POST | `/vendor/venues/:id` | Owner/editor; replace submission with current `version` |
| POST | `/vendor/venues/:id/photos` | Owner/editor; raw JPEG/PNG/WebP, returns `{id}`; does not publish |
| GET / POST | `/vendor/venues/:id/availability` | Owner/editor; upcoming entries / versioned slot update |
| GET | `/vendor/requests` | Owner/responders only |
| POST | `/vendor/venues/:id/requests/:requestId/responses` | Owner/responder; one offer or decline while PENDING |
| GET / POST | `/vendor/venues/:id/team` | Owner only; list members / add existing vendor email |
| POST | `/vendor/venues/:id/team/:memberId` | Owner only; versioned permission update/removal |
| GET | `/admin/venues` | Explicit admin permission; submissions, reviews and published snapshots |
| POST | `/admin/venues/:id/reviews` | Admin; versioned approve or request changes |
| GET / POST | `/support` | Account’s tickets / create a local support request |
| GET | `/admin/support` | Admin; support queue |
| POST | `/admin/support/:id` | Admin; versioned response and OPEN/CLOSED status |
| GET | `/notifications` | Own account updates, retained 90 days |
| POST | `/notifications/read` | Own notification `id` or `all` |
| GET | `/demo/venues/:id/requests` | Own customer’s requests for the sample venue |
| POST | `/demo/venues/:id/requests/:requestId/responses` | Own sample requests only; submitted venues cannot use this route |

## Payloads and state

An event plan stores `{name,type,date,budget,expenses,tasks,shopping,schedule,links,guests,tables,features,floorPlan,ceremony}`. Types are `wedding`, `conference`, `other`; the event date may be empty. Budget and expense amounts are nonnegative integer EGP guide values, not payment records. Tasks have an optional due date, shopping items have a quantity, and schedule entries have a date and time. `links` contains up to 30 unique `{kind,id}` references to the owner's existing venue or service inquiries. Only the plan owner can change links. GET `/plans/:id/inquiries` returns current linked summaries (`kind,id,name,date,status,quote`) to plan members and eligible options to the owner; private notes and conversations are omitted. Guests have UUID, name, optional group, email, phone, address, dietary notes and notes, RSVP (`pending`, `yes`, `no`) and meal choice (`none`, `standard`, `vegetarian`, `vegan`, `other`). Each table has a UUID, label, shape (`round`, `rect`, `long`, `square`, `sweetheart`, `serpentine`), optional width/depth in inches, bounded x/y position, 2–20 seats and an assignment array with one guest ID or null per seat. Room items have UUID, kind (`stage`, `dance`, `buffet`, `entrance`, `aisle`, `screen`), label and bounded position/size. A guest may occupy one seat only; a guest marked `no` cannot have a seat. Up to 500 guests, 80 tables, 30 room items, 100 expenses, 200 tasks, 200 shopping items and 100 schedule entries are accepted per plan. POST updates require the current `version` and return `409 CONFLICT` on a stale write. Each response includes `access` (`OWNER`, `EDIT`, `VIEW`); access is checked on every read and write. `floorPlan` is null or `{id,points:[{x,y},{x,y}],meters}`. Its media ID must belong to the event; a positive distance records a reference scale between two canvas points. Uploads are limited to 20 images per event to preserve undo history. `ceremony` stores row and wedding-party counts, blocked seat keys and assignments; one guest can occupy one ceremony seat and one table seat. These are draft layouts, not venue approved floor plans.

An inquiry accepts only `{venueId,spaceId,packageId,date,guests,event,session}`. Dates are validated against Africa/Cairo and the exact selected space capacity. Paused spaces and blocked slots reject new inquiries. Server inventory is authoritative. An inquiry fingerprint makes identical submissions idempotent per customer. New inquiries capture a snapshot for historical names/capacity/package price.

Inquiry states: `DRAFT → PENDING → OFFERED | DECLINED`. An import can promote a matching draft on explicit submission. A response is `{status,version,price}` for OFFERED or `{status,version,reason}` for DECLINED. Accepted decline reasons are `DATE_UNAVAILABLE` and `PACKAGE_UNAVAILABLE`. No state represents a reservation or booking confirmation.

Listings accept bilingual `nameEn/nameAr/descriptionEn/descriptionAr`, `area`, `kind`, venue `amenities`, `spaces`, `packages`, and `media`. Each of 1–8 spaces has a stable `id`, bilingual `name`, preset `capacity`, optional `kind`, selected `amenities`, optional `mediaId`, and `enabled` boolean. Each of 1–8 packages has a stable `id`, bilingual `name`, positive integer event `price`, and selected `includes`. Legacy capacity/price inputs still create the initial main space/Essential package. Photo IDs must belong to the same venue. A space photo must also be selected for that listing’s media. Existing inquiry references cannot be removed or reduced below the required capacity.

Listing state: `PENDING → APPROVED | CHANGES`; any edit becomes PENDING and increments version. The published snapshot remains live until another approval. Review `{decision,version,reason,note}` checks the version and commits publication, status, history and notifications together. Review reasons are `LISTING_DETAILS`, `PRICE_DETAILS`, `CAPACITY_DETAILS`, `CONTENT_DETAILS`, `OTHER`; OTHER needs a note.

Calendar writes accept `{spaceId,date,session,blocked:boolean,reason,version}`. An absent slot has version 0; each write increments it. Reasons: `PRIVATE_EVENT`, `MAINTENANCE`, `BOOKED_ELSEWHERE`. Removing a block stores `blocked:false`; it never asserts availability. Updates are audited and limited to the supported date horizon. They do not change existing inquiry statuses.

Messages accept `{text,nonce}` with a UUID nonce and 1–1000 characters. The nonce is unique per inquiry/sender so retries do not duplicate a message. Responses contain only message ID, sender role, text and timestamp. At most 200 messages are stored per inquiry. Drafts do not have conversations.

Support creates `{category,text}` with `ACCOUNT | LISTING | INQUIRY | OTHER` and 1–2000 characters. Up to 10 open tickets per account. Admin replies accept `{reply,status,version}` and retain an audit history. Tickets never disclose another account’s request records automatically.

Passwords are salted scrypt hashes. Recovery/verification token lookup uses SHA-256 hashes; the local transport mailbox temporarily stores raw bearer links and is accessible only to its account or the trusted CLI operator. Used/expired messages are pruned. A reset expires all sessions for that account. Real mailbox ownership is not proven by this preview.
