import base from '../data/verkooppunten.json';
import { hasRedis, readHash, APPROVED, type Place } from './redis';

/** The fixed list plus every café approved on /beheer (read at build time). */
export async function getPlaces(): Promise<Place[]> {
  if (!hasRedis) return base;
  try {
    const extra = await readHash<Place>(APPROVED);
    const known = new Set(base.map((p) => `${p.name}|${p.city}`.toLowerCase()));
    return [...base, ...extra.filter((p) => !known.has(`${p.name}|${p.city}`.toLowerCase()))];
  } catch {
    return base;
  }
}
