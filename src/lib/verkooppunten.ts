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
    // Skip approved cafés already in the fixed list (within ~100 m).
    const near = (a: Place, b: Place) => Math.abs(a.lat - b.lat) < 0.001 && Math.abs(a.lng - b.lng) < 0.0015;
    return [...base, ...extra.filter((p) => !base.some((b) => near(b, p)))];
  } catch {
    return base;
  }
}

/** English names for the countries and cities we store in Dutch. */
const EN_NAMES: Record<string, string> = {
  België: 'Belgium', Nederland: 'Netherlands', Duitsland: 'Germany', Frankrijk: 'France', Italië: 'Italy',
  'Verenigd Koninkrijk': 'United Kingdom', VS: 'USA', Litouwen: 'Lithuania', Noorwegen: 'Norway', Zweden: 'Sweden',
  Denemarken: 'Denmark', Spanje: 'Spain', Luxemburg: 'Luxembourg', Zwitserland: 'Switzerland', Oostenrijk: 'Austria', Polen: 'Poland',
  Antwerpen: 'Antwerp', Berlijn: 'Berlin', Brugge: 'Bruges', Brussel: 'Brussels', 'Brussel (Vorst)': 'Brussels (Forest)',
  'Den Haag': 'The Hague', Gent: 'Ghent', Londen: 'London', Napels: 'Naples', 'Oostakker (Gent)': 'Oostakker (Ghent)', Oostende: 'Ostend',
};
export const placesIn = (places: Place[], lang: 'nl' | 'en'): Place[] =>
  lang === 'en' ? places.map((p) => ({ ...p, city: EN_NAMES[p.city] ?? p.city, country: EN_NAMES[p.country] ?? p.country })) : places;
