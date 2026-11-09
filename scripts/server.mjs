import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../server/database.mjs';
import { handleApi, ApiError, json } from '../server/api.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 3000);
if (process.env.NODE_ENV === 'production') throw new Error('This demo server is for local development. Production authentication and hosting must be configured first.');
const db = openDatabase(process.env.WEDDO_DB_PATH || resolve(root,'.data/weddo.sqlite'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.tsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream'
};
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','same-origin');
  try {
    if (![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)) throw new ApiError(403,'HOST_REJECTED','Host is not allowed.');
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) { await handleApi(db,req,res,url); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const rel = relative(root, file);
    const allowed = rel === 'index.html' || ['src', 'public', 'components'].some(dir => rel.startsWith(`${dir}${sep}`));
    const details=allowed?await stat(file):null;
    if (!details?.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    if (extname(file)==='.glb') {
      res.writeHead(200, { 'Content-Type':'model/gltf-binary', 'Content-Length':details.size, 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
      if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
      return;
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    if(!(error instanceof ApiError) && req.url.startsWith('/api/'))console.error('API failure',{method:req.method,path:req.url.split('?')[0],code:error.code || 'INTERNAL_ERROR'});
    if (req.url.startsWith('/api/') || error instanceof ApiError) json(res,error instanceof ApiError ? error.status : 500,{error:{code:error instanceof ApiError ? error.code : 'SERVER_ERROR',message:error instanceof ApiError ? error.message : 'The server could not complete this request.'}});
    else { res.writeHead(404); res.end('Not found'); }
  }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Weddo is running at http://127.0.0.1:${port}`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>{db.close();process.exit(0);}));
