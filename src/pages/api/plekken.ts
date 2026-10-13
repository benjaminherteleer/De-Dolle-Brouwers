import type { APIRoute } from 'astro';
import { hasRedis, readHash, APPROVED, type Place } from '../../lib/redis';

export const prerender = false;

/**
 * The cafés approved on /beheer (already public on the map). The build reads this when it has no
 * Redis credentials of its own, so the map picks up approvals after the deploy hook runs.
 */
export const GET: APIRoute = async () => {
  if (!hasRedis) return new Response('[]', { status: 503, headers: { 'Content-Type': 'application/json' } });
  const places = (await readHash<Place>(APPROVED)).map(({ name, city, country, lat, lng }) => ({ name, city, country, lat, lng }));
  return new Response(JSON.stringify(places), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
