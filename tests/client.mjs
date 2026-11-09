import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { handleApi, ApiError } from '../server/api.mjs';

export function client(db) {
  const auth={cookie:'',csrf:''},address=randomUUID();
  async function call(method,path,payload,overrides={}) {
    const raw=payload===undefined?[]:[Buffer.isBuffer(payload)?payload:Buffer.from(typeof payload==='string'?payload:JSON.stringify(payload))];
    const req=Readable.from(raw);
    req.method=method;req.url=path;req.socket={remoteAddress:address};
    req.headers={host:'127.0.0.1:4173',origin:'http://127.0.0.1:4173','content-type':'application/json',cookie:auth.cookie,'x-csrf-token':auth.csrf,...overrides};
    const headers={};let status,data;
    const res={setHeader:(key,value)=>{headers[key]=value;},writeHead:(value,extra)=>{status=value;Object.assign(headers,extra);},end:value=>{data=Buffer.isBuffer(value) || value instanceof Uint8Array?Buffer.from(value):JSON.parse(value);}};
    try {await handleApi(db,req,res,new URL(path,'http://127.0.0.1:4173'));}
    catch(error){if(!(error instanceof ApiError))throw error;status=error.status;data={error:{code:error.code}};}
    if(headers['Set-Cookie'])auth.cookie=headers['Set-Cookie'].split(';')[0];
    if(data?.csrfToken)auth.csrf=data.csrfToken;
    return {status,data,headers};
  }
  return {call,auth};
}
