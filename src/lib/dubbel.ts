/**
 * Is a café tip already on the map? The same name in the same city or at the same spot (within ~150 m)
 * ("Café 't Botteltje" = "Botteltje", Brugge = brugge). Used by /api/tip (the tip form) and /beheer.
 */
type Spot = { name: string; city: string; lat?: number | null; lng?: number | null };

const FILLER = new Set(['cafe', 'bar', 'pub', 'tavern', 'taverne', 'de', 'het', 't', 'den', 'the', 'le', 'la', 'les', 'l', 'in', 'bij']);
const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !FILLER.has(w))
    .join(' ');

const sameName = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  return x === y || (Math.min(x.length, y.length) >= 5 && (x.includes(y) || y.includes(x)));
};
const sameCity = (a: string, b: string) => {
  const x = norm(a);
  const y = norm(b);
  return Boolean(x && y) && (x === y || x.includes(y) || y.includes(x));
};
const near = (a: Spot, b: Spot) =>
  a.lat != null && a.lng != null && b.lat != null && b.lng != null && Math.abs(a.lat - b.lat) < 0.0014 && Math.abs(a.lng - b.lng) < 0.002;

export function findDuplicate<T extends Spot>(tip: Spot, places: T[]): T | undefined {
  return places.find((p) => sameName(tip.name, p.name) && (sameCity(tip.city, p.city) || near(tip, p)));
}
