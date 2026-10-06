import type { APIRoute } from 'astro';
import { redis, hasRedis, PENDING, type Tip } from '../../lib/redis';

export const prerender = false;

const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** A visitor sends in a missing café: it waits in Redis until someone approves it on /beheer. */
export const POST: APIRoute = async ({ request }) => {
  if (!hasRedis) return new Response('Geen opslag', { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response('Ongeldig', { status: 400 });
  }
  if (body.honey) return new Response(null, { status: 204 });
  const name = clean(body.name, 120);
  const city = clean(body.city, 80);
  if (!name || !city) return new Response('Naam en stad ontbreken', { status: 400 });
  if ((await redis<number>('HLEN', PENDING)) >= 300) return new Response('Wachtlijst vol', { status: 429 });

  const tip: Tip = {
    id: crypto.randomUUID().slice(0, 8),
    name,
    city,
    country: clean(body.country, 60),
    lat: num(body.lat) as number,
    lng: num(body.lng) as number,
    note: clean(body.note, 500),
    from: clean(body.from, 80),
    email: clean(body.email, 120),
    at: new Date().toISOString(),
  };
  await redis('HSET', PENDING, tip.id, JSON.stringify(tip));
  return new Response(null, { status: 204 });
};
