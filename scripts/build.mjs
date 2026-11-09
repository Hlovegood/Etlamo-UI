import { cp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'src', 'public', 'server', 'components']) await cp(new URL(name, root), new URL(name, dist), { recursive: true });
await mkdir(new URL('scripts/',dist));
for(const script of ['server.mjs','review-venue.mjs','admin-access.mjs','mail-preview.mjs','database.mjs']) await cp(new URL(`scripts/${script}`,root),new URL(`scripts/${script}`,dist));
const source=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
await writeFile(new URL('package.json',dist),JSON.stringify({name:source.name,version:source.version,private:true,type:'module',scripts:{start:'node scripts/server.mjs',backup:'node scripts/database.mjs backup',restore:'node scripts/database.mjs restore'},engines:source.engines},null,2));
await writeFile(new URL('README.md',dist),`# Weddo local preview ${source.version}

Requires Node.js 24 or newer; no package installation is needed.

Run npm start in this directory and open http://127.0.0.1:4173.
Keep the terminal open; press Ctrl+C to stop. Use PORT to select another local port.
The preview creates its own .data/weddo.sqlite. Preserve that directory to keep records.
Use WEDDO_DB_PATH to select another database file. Real project records are not included.

Use npm run backup to create a verified backup. To restore into a NEW file:
npm run restore -- /absolute/path/backup.sqlite /absolute/path/restored.sqlite
Then stop the preview and restart with WEDDO_DB_PATH pointing to that restored file.
Existing files are never overwritten by these commands.

Admin access: node scripts/admin-access.mjs <registered-email> grant
Local recovery link: node scripts/mail-preview.mjs <registered-email>
Only the trusted local operator should use these commands or handle database backups.

This is a loopback-only local preview. Production mode is refused.
No real email, payments or confirmed bookings are connected.
See server/API.md for the API contract.
`);
console.log('Built local runnable application in dist/. Start it with npm start in that directory.');
