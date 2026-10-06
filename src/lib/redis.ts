/** Tiny client for the Upstash Redis REST API, linked to the project in Vercel. */
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.STORAGE_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.STORAGE_REST_API_TOKEN;

export const hasRedis = Boolean(url && token);

export async function redis<T = unknown>(...command: (string | number)[]): Promise<T> {
  if (!hasRedis) throw new Error('Geen opslag gekoppeld');
  const res = await fetch(url!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result as T;
}

export type Place = { name: string; city: string; country: string; lat: number; lng: number };
export type Tip = Place & { id: string; note: string; from: string; email: string; at: string };

/** Pending suggestions and approved cafés live in two Redis hashes, keyed by id. */
export const PENDING = 'tips';
export const APPROVED = 'goedgekeurd';

export async function readHash<T>(key: string): Promise<T[]> {
  const flat = await redis<string[]>('HGETALL', key);
  const out: T[] = [];
  for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]));
  return out;
}
