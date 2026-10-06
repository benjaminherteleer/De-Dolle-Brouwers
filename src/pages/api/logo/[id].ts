import type { APIRoute } from 'astro';
import { redis, hasRedis } from '../../../lib/redis';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  if (!hasRedis || !/^[0-9a-f]{16}$/.test(params.id ?? '')) return new Response('Niet gevonden', { status: 404 });
  const data = await redis<string | null>('GET', `logo:${params.id}`);
  const match = data?.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return new Response('Niet gevonden', { status: 404 });
  return new Response(Buffer.from(match[2], 'base64'), {
    headers: {
      'Content-Type': match[1],
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Security-Policy': "default-src 'none'",
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
