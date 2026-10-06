import type { APIRoute } from 'astro';
import { redis, hasRedis, readHash, PENDING, APPROVED, type Tip } from '../../lib/redis';

export const prerender = false;

const password = process.env.BEHEER_WACHTWOORD;
const allowed = (request: Request) => Boolean(password) && request.headers.get('authorization') === `Bearer ${password}`;
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** List the waiting tips and the cafés approved so far. */
export const GET: APIRoute = async ({ request }) => {
  if (!hasRedis || !password) return json({ error: 'Nog niet ingesteld' }, 503);
  if (!allowed(request)) return json({ error: 'Fout wachtwoord' }, 401);
  const byDate = (a: Tip, b: Tip) => (a.at < b.at ? 1 : -1);
  return json({
    pending: (await readHash<Tip>(PENDING)).sort(byDate),
    approved: (await readHash<Tip>(APPROVED)).sort(byDate),
  });
};

/** Approve (with corrections), reject, or take an approved café off the map again. */
export const POST: APIRoute = async ({ request }) => {
  if (!hasRedis || !password) return json({ error: 'Nog niet ingesteld' }, 503);
  if (!allowed(request)) return json({ error: 'Fout wachtwoord' }, 401);
  const { id, action, place } = await request.json();
  const raw = await redis<string | null>('HGET', action === 'verwijder' ? APPROVED : PENDING, id);
  if (!raw) return json({ error: 'Niet gevonden' }, 404);

  if (action === 'ok') {
    const tip: Tip = { ...JSON.parse(raw), ...place };
    if (!Number.isFinite(tip.lat) || !Number.isFinite(tip.lng)) return json({ error: 'Locatie ontbreekt' }, 400);
    await redis('HSET', APPROVED, id, JSON.stringify(tip));
    await redis('HDEL', PENDING, id);
  } else if (action === 'nee') {
    await redis('HDEL', PENDING, id);
  } else if (action === 'verwijder') {
    await redis('HDEL', APPROVED, id);
  } else {
    return json({ error: 'Onbekende actie' }, 400);
  }

  // Rebuild the site so the map picks up the change.
  let rebuilt = false;
  if (action !== 'nee' && process.env.DEPLOY_HOOK_URL) {
    rebuilt = (await fetch(process.env.DEPLOY_HOOK_URL, { method: 'POST' }).catch(() => null))?.ok ?? false;
  }
  return json({ ok: true, rebuilt });
};
