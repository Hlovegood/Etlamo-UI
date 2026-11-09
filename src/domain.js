import { areas } from './areas.js';
import { venues, findVenue, capacityOf, startingPrice, guestCounts, eventTypes, sessions, conferenceKinds } from './data.js';

export const defaultFilters = () => ({ category:'all', area: 'all', date: '', guests: 'any', budget: 'any' });
export const guestRanges = ['any', '10-50', '50-100', '100-200', '200-350', '350-500', '500+'];
export const budgetRanges = ['any', '100000', '250000', '250000+'];
export function today() {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const value = type => parts.find(part=>part.type===type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function validDate(value, requireUpcoming = true) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return year >= 2000 && parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day && (!requireUpcoming || value >= today());
}
export function parseFilters(params) {
  const get = key => params.get(key);
  return {
    category: ['all','wedding','conference'].includes(get('category')) ? get('category') : 'all',
    area: areas.some(area => area.id === get('area')) ? get('area') : 'all',
    date: validDate(get('date')) ? get('date') : '',
    guests: guestRanges.includes(get('guests')) ? get('guests') : 'any',
    budget: budgetRanges.includes(get('budget')) ? get('budget') : 'any',
  };
}
export function searchVenues(filters) {
  const minGuests = filters.guests === 'any' ? 0 : Number.parseInt(filters.guests, 10);
  return venues.filter(venue => {
    const isConference=conferenceKinds.includes(venue.kind);
    const inCategory=!filters.category || filters.category==='all' || (filters.category==='conference' ? isConference : !isConference);
    const inArea = filters.area === 'all' || venue.area === filters.area || (filters.area === 'central-cairo' && venue.area === 'garden-city');
    // Unknown availability is never used to exclude a venue or claim it is available.
    // Guest bands match at least their lower bound; the request uses an exact count.
    const price = startingPrice(venue);
    const inBudget = filters.budget === 'any' || (filters.budget === '250000+' ? price>250000 : price <= Number(filters.budget));
    const possible=venue.spaces.some(space=>space.enabled!==false && space.capacity>=minGuests && (!filters.date || sessions.some(session=>!blockedSlot(venue,space.id,filters.date,session))));
    return inCategory && inArea && possible && inBudget;
  });
}
export function validateRequest(request, upcoming = true) {
  if (!request || typeof request !== 'object') return 'invalid';
  const venue = findVenue(request.venueId);
  const space = venue?.spaces.find(space => space.id === request.spaceId);
  if (!venue || !space || !venue.packages.some(pkg => pkg.id === request.packageId)) return 'invalid';
  if (upcoming && space.enabled===false)return 'space';
  if (!eventTypes.includes(request.event) || !sessions.includes(request.session) || !guestCounts.includes(request.guests)) return 'invalid';
  if (!validDate(request.date, upcoming)) return 'date';
  if (request.guests > space.capacity) return 'capacity';
  return null;
}
export const requestFingerprint = request => JSON.stringify([request.venueId, request.date, request.guests, request.spaceId, request.packageId, request.event, request.session]);
export const blockedSlot=(venue,spaceId,date,session)=>(venue.availability || []).some(slot=>slot.spaceId===spaceId && slot.date===date && slot.session===session && slot.blocked===1);
