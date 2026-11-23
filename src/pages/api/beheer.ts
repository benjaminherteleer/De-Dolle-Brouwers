import type { APIRoute } from 'astro';
import { getPlaces } from '../../lib/verkooppunten';
import { findDuplicate } from '../../lib/dubbel';
import { redis, hasRedis, readHash, PENDING, APPROVED, NIEUWSBRIEF, type Tip, type Inschrijving } from '../../lib/redis';

export const prerender = false;

const password = process.env.BEHEER_WACHTWOORD;
/** Compare without stopping at the first wrong character, so the time taken gives nothing away. */
const sameText = (a: string, b: string) => {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
};
const allowed = (request: Request) => Boolean(password) && sameText(request.headers.get('authorization') ?? '', `Bearer ${password}`);

/** Block an address for a quarter of an hour after 10 wrong passwords. Returns a response when blocked. */
const MAX_FOUT = 10;
const fouten = (request: Request) => `beheer:fout:${request.headers.get('cf-connecting-ip') ?? 'onbekend'}`;
async function checkAccess(request: Request) {
  if (!hasRedis || !password) return json({ error: 'Nog niet ingesteld' }, 503);
  const key = fouten(request);
  if (Number((await redis<string | null>('GET', key)) ?? 0) >= MAX_FOUT) return json({ error: 'Te veel pogingen, probeer het over een kwartier opnieuw' }, 429);
  if (!allowed(request)) {
    await redis('INCR', key);
    await redis('EXPIRE', key, 900);
    return json({ error: 'Fout wachtwoord' }, 401);
  }
  return null;
}
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** List the waiting tips and the cafés approved so far. */
export const GET: APIRoute = async ({ request }) => {
  const blocked = await checkAccess(request);
  if (blocked) return blocked;
  const byDate = (a: Tip, b: Tip) => (a.at < b.at ? 1 : -1);
  // Mark tips that are already on the map, so they aren't approved twice
  const places = await getPlaces();
  const pending = (await readHash<Tip>(PENDING)).sort(byDate).map((t) => {
    const d = findDuplicate(t, places);
    return d ? { ...t, dubbel: `${d.name}, ${d.city}` } : t;
  });
  return json({
    pending,
    approved: (await readHash<Tip>(APPROVED)).sort(byDate),
    nieuwsbrief: (await readHash<Inschrijving>(NIEUWSBRIEF)).sort((a, b) => (a.at < b.at ? 1 : -1)),
  });
};

/** Approve (with corrections), reject, or take an approved café off the map again. */
export const POST: APIRoute = async ({ request }) => {
  const blocked = await checkAccess(request);
  if (blocked) return blocked;
  const { id, action, place } = await request.json();
  if (action === 'uitschrijven') {
    await redis('HDEL', NIEUWSBRIEF, String(id));
    return json({ ok: true });
  }
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
