import base from '../data/verkooppunten.json';
import { hasRedis, readHash, APPROVED, type Place } from './redis';

// The search returns country names in the visitor's language; the map groups by the Dutch ones.
const COUNTRIES: Record<string, string> = {
  belgium: 'België', belgique: 'België', belgien: 'België',
  netherlands: 'Nederland', 'the netherlands': 'Nederland', 'pays-bas': 'Nederland', niederlande: 'Nederland',
  germany: 'Duitsland', deutschland: 'Duitsland', allemagne: 'Duitsland',
  france: 'Frankrijk', frankreich: 'Frankrijk',
  italy: 'Italië', italia: 'Italië', italie: 'Italië', italien: 'Italië',
  'united kingdom': 'Verenigd Koninkrijk', 'royaume-uni': 'Verenigd Koninkrijk',
  'united states': 'VS', 'united states of america': 'VS', usa: 'VS', 'états-unis': 'VS',
  lithuania: 'Litouwen', lietuva: 'Litouwen', norway: 'Noorwegen', norge: 'Noorwegen',
  sweden: 'Zweden', sverige: 'Zweden', denmark: 'Denemarken', danmark: 'Denemarken',
  spain: 'Spanje', españa: 'Spanje', luxembourg: 'Luxemburg', switzerland: 'Zwitserland',
  austria: 'Oostenrijk', poland: 'Polen', japan: 'Japan', canada: 'Canada',
};
const dutch = (c: string) => COUNTRIES[c.trim().toLowerCase()] ?? c;

/** The fixed list plus every café approved on /beheer (read at build time). */
export async function getPlaces(): Promise<Place[]> {
  if (!hasRedis) return base;
  try {
    const extra = (await readHash<Place>(APPROVED)).map(({ name, city, country, lat, lng }) => ({
      name,
      city,
      country: dutch(country),
      lat,
      lng,
    }));
    const known = new Set(base.map((p) => `${p.name}|${p.city}`.toLowerCase()));
    return [...base, ...extra.filter((p) => !known.has(`${p.name}|${p.city}`.toLowerCase()))];
  } catch {
    return base;
  }
}
