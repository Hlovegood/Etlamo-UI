import { findVenue, venueKinds, venueAmenities, packageInclusions } from './data.js';
import { validateRequest } from './domain.js';
import { venues } from './data.js';
import { areas } from './areas.js';
import { api, startSession, listAll, ConnectionError } from './api.js';
let requestsCache = [];
let connected = false;
let account=null;
let accountSaved=[];
export const getAccount=()=>account;
export async function changeAccount(mode,input={}) {
  const guestSaved=!account?getSaved():[];
  const result=await api(`/api/auth/${mode}`,input);account=result.account;requestsCache=[];
  if(mode==='register')for(const venueId of guestSaved)await api('/api/favorites',{venueId,saved:true});
  await refreshRequests();await refreshSaved();return account;
}
export const isConnected = () => connected;
const keys = { saved: 'weddo.saved.v1', requests: 'weddo.requests.v1', language: 'weddo.language.v1' };
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function getLanguage() { return read(keys.language, 'ar') === 'en' ? 'en' : 'ar'; }
export function saveLanguage(language) { return write(keys.language, language); }
export function getSaved() {
  if(account)return accountSaved;
  const values = read(keys.saved, []);
  return Array.isArray(values) ? [...new Set(values.filter(id => typeof id === 'string' && findVenue(id)))] : [];
}
export async function saveSaved(ids) {
  if(!account)return write(keys.saved,ids);
  try {
    for(const id of new Set([...ids,...accountSaved]))if(ids.includes(id)!==accountSaved.includes(id))await api('/api/favorites',{venueId:id,saved:ids.includes(id)});
    await refreshSaved();return true;
  }catch{return false;}
}
export async function refreshSaved() {accountSaved=account?(await api('/api/favorites')).ids:[];}
export function getLegacyRequests() {
  const values = read(keys.requests, []);
  return Array.isArray(values) ? values.filter(request => !validateRequest(request, false) && typeof request.id === 'string' && /^[a-f\d-]{36}$/i.test(request.id) && typeof request.createdAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(request.createdAt) && Number.isFinite(Date.parse(request.createdAt))) : [];
}
export function getRequests() { return requestsCache; }
function validInventory(items) {
  const name = value => value && ['en','ar'].every(lang=>typeof value[lang]==='string' && value[lang].length>0 && value[lang].length<=2000);
  return items.every(venue => venue && typeof venue.id==='string' && /^[a-z0-9-]{1,80}$/.test(venue.id) && name(venue.name) && name(venue.description) && areas.some(area=>area.id===venue.area) && venueKinds.includes(venue.kind) && ['garden','coral','blue'].includes(venue.theme) && Array.isArray(venue.spaces) && venue.spaces.length>0 && venue.spaces.every(space=>name(space.name) && /^[a-z0-9-]{1,80}$/.test(space.id) && Number.isSafeInteger(space.capacity) && space.capacity>0) && Array.isArray(venue.packages) && venue.packages.length>0 && venue.packages.every(pkg=>(['essential','celebration'].includes(pkg.id) || (name(pkg.name) && /^[a-z0-9-]{1,80}$/.test(pkg.id))) && Number.isSafeInteger(pkg.price) && pkg.price>0 && Array.isArray(pkg.includes) && pkg.includes.every(value=>packageInclusions.includes(value))) && Array.isArray(venue.amenities) && venue.amenities.every(value=>venueAmenities.includes(value))) && new Set(items.map(item=>item.id)).size===items.length;
}
function validResponse(request) {
  if (!request.response) return ['PENDING','DRAFT'].includes(request.status);
  const reply=request.response;
  return request.status===reply.status && ((reply.status==='OFFERED' && Number.isSafeInteger(reply.price) && reply.price>0) || (reply.status==='DECLINED' && ['DATE_UNAVAILABLE','PACKAGE_UNAVAILABLE'].includes(reply.reason))) && typeof reply.createdAt==='string' && Number.isFinite(Date.parse(reply.createdAt));
}
function validServerRequest(request) {
  return !validateRequest(request,false) && typeof request.id==='string' && /^[a-f0-9-]{36}$/.test(request.id) && typeof request.createdAt==='string' && Number.isFinite(Date.parse(request.createdAt)) && ['DRAFT','PENDING','OFFERED','DECLINED'].includes(request.status) && Number.isInteger(request.version) && validResponse(request);
}
export async function refreshRequests() {
  await refreshCatalog();
  const items=await listAll('/api/requests');
  if (!items.every(validServerRequest)) throw new ConnectionError('CONNECTION_FAILED');
  requestsCache=items; connected=true;
}
export async function refreshCatalog() {
  const inventory=await listAll('/api/venues');
  if (!validInventory(inventory)) throw new ConnectionError('CONNECTION_FAILED');
  venues.splice(0,venues.length,...inventory);
}
export async function initializeConnection() {
  account=await startSession();
  await refreshCatalog();
  const legacy=account ? [] : getLegacyRequests();
  for (let index=0;index<legacy.length;index+=100) await api('/api/requests/imports',{requests:legacy.slice(index,index+100)});
  await refreshRequests();
  await refreshSaved();
}
export async function saveRequest(draft) {
  const error = validateRequest(draft);
  if (error) return { ok: false, error };
  try {
    const result=await api('/api/requests',draft);
    if (!validServerRequest(result.request)) throw new ConnectionError('CONNECTION_FAILED');
    requestsCache=[result.request,...requestsCache.filter(item=>item.id!==result.request.id)];
    return {ok:true,...result};
  } catch (error) { return {ok:false,error:error.code==='DATE_BLOCKED'?'blocked':error.code==='CAPACITY_EXCEEDED'?'capacity':error.code==='INVALID_DATE'?'date':'connection'}; }
}
export async function sendDemoResponse(venueId,requestId,input) {
  const result=await api(`/api/demo/venues/${venueId}/requests/${requestId}/responses`,input);
  if (!validServerRequest(result.request)) throw new ConnectionError('CONNECTION_FAILED');
  requestsCache=requestsCache.map(item=>item.id===requestId?result.request:item);
  return result.request;
}
