let csrfToken = '';
export class ConnectionError extends Error {
  constructor(code) { super(code); this.code = code; }
}
export async function api(path, input) {
  let response;
  try {
    response = await fetch(path, { credentials:'same-origin', signal:AbortSignal.timeout(15000), ...(input ? {method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},body:JSON.stringify(input)} : {}) });
  } catch { throw new ConnectionError('CONNECTION_FAILED'); }
  let result;
  try { result=await response.json(); } catch { throw new ConnectionError('CONNECTION_FAILED'); }
  if (!response.ok) throw new ConnectionError(result.error?.code || 'CONNECTION_FAILED');
  if (result.csrfToken) csrfToken=result.csrfToken;
  return result;
}
export async function startSession() {
  const result=await api('/api/session');
  if (!/^[a-f0-9]{64}$/.test(result.csrfToken) || result.isDemo!==true) throw new ConnectionError('CONNECTION_FAILED');
  csrfToken=result.csrfToken;
  return result.account || null;
}
export async function uploadPhoto(venueId,file,kind='venues') {
  let response;
  try {response=await fetch(`/api/vendor/${kind}/${venueId}/photos`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':file.type,'X-CSRF-Token':csrfToken},body:file,signal:AbortSignal.timeout(30000)});}
  catch {throw new ConnectionError('CONNECTION_FAILED');}
  const result=await response.json();
  if(!response.ok)throw new ConnectionError(result.error?.code || 'CONNECTION_FAILED');
  return result.id;
}
export async function uploadFloorPlan(planId,file) {
  let response;
  try {response=await fetch(`/api/plans/${planId}/floor-plan`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':file.type,'X-CSRF-Token':csrfToken},body:file,signal:AbortSignal.timeout(30000)});}
  catch {throw new ConnectionError('CONNECTION_FAILED');}
  const result=await response.json();
  if(!response.ok)throw new ConnectionError(result.error?.code || 'CONNECTION_FAILED');
  return result.id;
}
export async function listAll(path) {
  const items=[]; let offset=0;
  do {
    const result=await api(`${path}?limit=50&offset=${offset}`);
    if (!Array.isArray(result.items) || (result.nextOffset!==null && (!Number.isInteger(result.nextOffset) || result.nextOffset<=offset))) throw new ConnectionError('CONNECTION_FAILED');
    items.push(...result.items); offset=result.nextOffset;
  } while (offset!==null);
  return items;
}
