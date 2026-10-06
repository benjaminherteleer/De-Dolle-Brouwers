import type { APIRoute } from 'astro';
import { redis, hasRedis, NIEUWSBRIEF, type Inschrijving } from '../../lib/redis';

export const prerender = false;

/** Footer sign-up for the Oerbier FAKE news: stores the address, listed on /beheer. */
export const POST: APIRoute = async ({ request }) => {
  if (!hasRedis) return new Response('Geen opslag', { status: 503 });
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response('Ongeldig', { status: 400 });
  }
  if (body.honey) return new Response(null, { status: 204 });
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response('Ongeldig adres', { status: 400 });
  if ((await redis<number>('HLEN', NIEUWSBRIEF)) >= 20000) return new Response('Lijst vol', { status: 429 });

  const entry: Inschrijving = { email, at: new Date().toISOString() };
  // HSETNX keeps the first sign-up date when someone signs up twice
  await redis('HSETNX', NIEUWSBRIEF, email, JSON.stringify(entry));
  return new Response(null, { status: 204 });
};
