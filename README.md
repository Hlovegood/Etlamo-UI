# Weddo local event preview — v0.23

Arabic and English customer web, responsive mobile web, vendor operations and admin review. Weddo remains a working name. This is a local preview; it has no real email delivery, payment processing or confirmed bookings.

The home page now has a clearer venue search, an airy blue hero with gentle moving sky and illustration, and navigation that stays on one scrollable row at narrower widths. The motion stops when the device requests reduced motion.

## Event planning

After signing in, open **Plan event** to create a wedding, conference or other event. The **Overview** includes budget and costs, tasks, shopping items, guest groups, RSVP status, meal choices, and an event-day run sheet. **Quick start** adds wedding, conference or general suggestions to empty task and shopping lists, plus a sample timed schedule when the plan has an event date. It never replaces existing lists, and each suggestion can be removed or replaced with your own entry. Set the event date and add timed activities; activities on other dates remain listed separately. Plan owners can link their existing venue and service inquiries. The plan shows each linked inquiry's latest status and quote, with a route back to the inquiry. A quote is not a booking. **Seating chart** has a full-page workspace with a grid canvas, zoom controls, a preset picker for six table shapes, six room item types, and private floor plan image upload with a two-point distance reference. You can drag tables and guests onto seats. Assigned seats are colored by meal choice. A separate **Guest List** page holds contact, address, dietary and notes fields, CSV import and filtering. **Ceremony** provides configurable rows, reserved seats and guest assignment.  A person marked not attending is removed from any assigned seat. Undo/redo covers the last 20 successful changes during the current page session. You can print or save a PDF of the current view and download a guest CSV.

Plan owners can invite up to 10 existing Weddo accounts from the Overview as viewers or editors. Viewers can read and export; editors can update the plan; only the owner can change access or linked inquiries. Shared members see linked inquiry summaries, not private notes or conversations. A plan and its sharing data persist in local SQLite. The Client presentation tab shows a clean, read-only overhead chart with a browser Save as PDF option; invited viewers can open it after signing in. Its guest list stays inside the account-protected plan. Owners can copy its local link from the sharing section. That link only works on this computer until Weddo is hosted online. The 3D preview offers sample wedding, conference and mixed arrangements without changing saved data. An empty plan can adopt a sample as its editable seating chart. Quick layouts are offered only before adding tables, so using one cannot replace a saved arrangement.

The **3D view** now opens as a client preview of the saved tables, assigned seats and room items. It starts overhead, then offers guided stops for the stage and entrance when those items exist, plus a room walk view. A table can be selected on the model or from a list; assigned guest names appear only in that table's details. Drag and scroll still adjust the camera. The room shell and dimensions are illustrative, not verified venue measurements. **3D walkthrough** is available directly at `#/walkthrough` and from the home page. Wedding plans also offer it as **Original wedding scene**. It uses the separately supplied `rec_room_wedding.glb` and includes seven camera stops, scene pins, a timed tour, keyboard navigation, sound cues, reset, fullscreen, zoom, and lighting controls. Tour links open real Weddo sections. This 87 MB sample is not a real venue or a rendering of saved tables. Its embedded metadata credits [Lol_o9's Rec Room - Wedding model](https://sketchfab.com/3d-models/rec-room-wedding-2983d1e21f3f4037a3c3354187a160c2) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); attribution also appears beside the viewer. The 2D editor remains usable when WebGL is unavailable. Venue detail pages retain illustrative indoor or outdoor 3D examples. The self-hosted Three.js libraries retain their [MIT license](public/vendor/LICENSE-three.txt). Venue confirmation, venue-specific models and Android/iOS apps remain in development. See [the expansion tracker](../EXPANSION.md).

## Conference spaces

The home search can show all spaces, wedding venues or conference rooms and halls. A clearly marked sample conference venue demonstrates room sizes, Wi-Fi/projector details and packages. Selecting a room starts an inquiry with **Conference** and a suitable attendee count preselected. Venue owners can submit conference rooms or halls through the existing vendor form; they appear in search only after admin approval. This remains an inquiry, not a reservation.

## Event services

**Services** includes photography, catering, design/décor, flowers and entertainment. The five example cards are illustrative only and cannot receive inquiries. Vendor accounts can submit bilingual details, a service type, up to three packages and up to three photos through **Manage services**. Save a service before uploading photos, then submit it again to publish the selected images after admin review. Approved listings appear to customers with category, Cairo area and price filters. Customers choose a package when asking about a date; vendors can quote or decline. Submission, review and inquiry updates appear in the private notification center. This remains a local preview without confirmed reservations.

## Run

Requires Node.js 24 or newer. No dependencies need installing.

```sh
cd weddo-web
npm run dev
```

Open http://127.0.0.1:4173. Keep the terminal running while using the preview. To stop it, press Ctrl+C. Run the same command again after restarting your computer. If the page refuses to connect, the local server needs to be running.

`PORT=4174 npm run dev` chooses another port. `WEDDO_DB_PATH=/absolute/path/weddo.sqlite npm run dev` selects a database. The default is `.data/weddo.sqlite`. This directory preserves accounts, sessions, listings, photos, inquiries and messages; do not remove it to restart the website. The server accepts only loopback hosts and refuses production mode.

## Customer tasks

- Search all Cairo areas using space type, area, date, guest band and budget selectors. Unknown availability is never claimed as available. Venues whose suitable spaces are all blocked for both sessions on the selected date are excluded.
- View named spaces, their capacity, type, facilities and optional assigned photo; compare named guide-price packages and inclusions.
- Compare up to three venues in a responsive table. Comparison is a temporary selection in the current tab.
- Save venues. Guests use browser storage; signed-in accounts keep their shortlist on the server across sign-ins and devices. Creating an account preserves a guest shortlist; signing in to an existing account loads that account’s shortlist.
- Send a structured inquiry, review the details, track replies, and open its private conversation/history. An inquiry or offer never reserves a date.
- New inquiries keep a snapshot of the selected venue, space and package price. Historic requests created before v0.7 fall back to the catalog information available for them.
- Contact local support and track its reply. No external support team is contacted.

## Accounts and access

Register as **Couple / customer** or **Venue owner**. Accounts use salted scrypt passwords, rotating sessions, HttpOnly/SameSite cookies, origin and CSRF protection, persistent attempt limits, and server-side ownership checks. Registration preserves that guest session’s inquiries; signing into an existing account does not transfer another guest’s inquiries.

Owners can add existing vendor accounts to a venue team with **Edit**, **Reply**, or **Both** permissions. Only owners manage the team. Removing access blocks subsequent API calls. Membership does not grant admin privileges.

Admin review access must be explicitly granted to an existing account by the trusted local operator:

```sh
node scripts/admin-access.mjs <registered-email> grant
# Remove review access:
node scripts/admin-access.mjs <registered-email> revoke
```

Refresh the account page after changing permissions. No default admin password is created.

## Venue workflow

**Vendor dashboard → Add a venue** collects bilingual names/descriptions, area, venue facilities, 1–8 named spaces, and 1–8 named packages. Each space supports type, capacity, facilities, optional photo and accepting/pausing new inquiries. Each package has bilingual names, an indicative price per event and selected inclusions.

After creating a venue, open **Edit venue** to upload photos. Upload only photos you own or have permission to publish. The browser resizes images and removes metadata. The server accepts bounded JPEG/PNG/WebP raster content only. Up to eight selected photos can be submitted per listing, with a local ceiling of 40 uploaded assets per venue. Unselected assets remain private; cleanup/long-term retention awaits a business policy. Uploading a photo alone does not publish it.

**Admin → Venue reviews** shows all submitted spaces, packages, photos and the previous published version. Approve and publish or request changes with a reason. Published edits remain under review while the last approved version stays public. Review and permission changes use versions to reject stale writes. Existing inquiry spaces/packages cannot be deleted or reduced below their recorded guest counts. Listing approval does not certify identity or availability.

**Manage dates** records a block or removes one for a space/date/session. Dates up to three calendar years ahead are supported, with up to 2,000 upcoming entries per venue. Every change records the actor and timestamp. A block prevents new inquiries for that slot; existing inquiries remain unchanged. Removing a block returns the time to unknown availability. The calendar is indicative and does not create a booking.

Owners and permitted responders can reply with a price or a decline reason, and exchange messages in an inquiry conversation. Conversations are limited to 200 messages per inquiry. Editors cannot read private inquiries without reply permission. Demo replies remain limited to the customer’s own sample-venue requests.

## Local email preview and notifications

**My account → Prepare verification link** puts an expiring single-use link into that account’s private local mailbox. This does not prove control of a real mailbox. Reset links expire after 30 minutes; verification links after 24 hours. Token validation stores hashes. The private transport preview temporarily retains bearer links until used or expired.

Signed-out recovery requests return the same response for existing and missing accounts and never return a token. The trusted local operator can retrieve a prepared link:

```sh
node scripts/mail-preview.mjs <registered-email>
```

A password reset invalidates existing account sessions. Notifications cover inquiries, messages, reviews, team access and support, with private read/unread controls and 90-day notification retention. No email/SMS/push provider is connected.

## Backup and recovery

A verified backup of the pre-v0.7 working database was made before migration. New tables are additive; existing accounts, permissions, listings and inquiries are retained.

```sh
npm run backup
# Or choose a NEW output file:
npm run backup -- /absolute/path/weddo-backup.sqlite
# Restore into a NEW database file:
npm run restore -- /absolute/path/weddo-backup.sqlite /absolute/path/restored.sqlite
```

The copy tool reads an active SQLite WAL database safely and checks the result’s integrity. It never overwrites an existing file. Stop the preview, then start it with `WEDDO_DB_PATH` pointing at the restored file to use that copy. Backups include private data and authentication material; copies have owner-only file permissions and should stay in trusted storage.

`GET /api/health` returns a minimal local status. Internal API failures log a method, path and error code without request bodies, cookies or recovery tokens.

## Checks and packaging

```sh
npm run check
npm test
npm run build
```

Checks cover API validation/isolation, duplicate and stale writes, account favorites, publication/media privacy, staff revocation, blocked dates, conversations, support, verification/recovery, paused spaces, persistence and backup recovery. Test databases are disposable and separate from real records. The CI workflow is prepared in `.github/workflows/ci.yml`; remote CI has not run because this workspace is not connected to a Git repository.

`dist/` is a runnable local package with the frontend, backend and operator commands. Run `npm start` inside it; it creates a separate database unless `WEDDO_DB_PATH` points at your existing one. Static hosting alone will not work. `.data/`, backups and credentials are not copied into the package.

See [API.md](server/API.md), [ARCHITECTURE.md](ARCHITECTURE.md) and [the delivery report](../DELIVERY.md). Production hosting, HTTPS, real communications, maps, native mobile apps, business policies and payment/booking confirmation remain outside this local package.
