import type { APIRoute } from 'astro';
import { redis, hasRedis } from '../../lib/redis';

export const prerender = false;

const MAX = 900_000; // characters of data URL, ~650 kB image

/** Stores the logo for a personalised figurine; the order carries the link to it. */
export const POST: APIRoute = async ({ request, url }) => {
  if (!hasRedis) return new Response('Geen opslag', { status: 503 });
  const { data } = await request.json().catch(() => ({}));
  if (typeof data !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(data) || data.length > MAX) {
    return new Response('Ongeldig bestand', { status: 400 });
  }
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  // Kept for two years: long enough to make the figurine and answer questions afterwards
  await redis('SET', `logo:${id}`, data, 'EX', 60 * 60 * 24 * 730);
  return Response.json({ url: `${url.origin}/api/logo/${id}` });
};
