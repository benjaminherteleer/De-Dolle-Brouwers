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
// Some lookups give every official name at once ("België / Belgique / Belgien"): take the first one we know.
const dutch = (c: string) => {
  const parts = c.split('/').map((p) => p.trim());
  for (const p of parts) {
    const hit = COUNTRIES[p.toLowerCase()] ?? Object.values(COUNTRIES).find((v) => v === p);
    if (hit) return hit;
  }
  return parts[0] || c;
};

/** Approved cafés: straight from Redis, or (in a build without Redis credentials) from the live site. */
async function approved(): Promise<Place[]> {
  if (hasRedis) return readHash<Place>(APPROVED);
  const res = await fetch('https://www.dedollebrouwers.be/api/plekken', { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** The fixed list plus every café approved on /beheer (read at build time). */
export async function getPlaces(): Promise<Place[]> {
  try {
    const extra = (await approved()).map(({ name, city, country, lat, lng }) => ({
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

/** Belgian provinces (Dutch names), English names for the list on /en. */
const PROVINCIE_EN: Record<string, string> = {
  'West-Vlaanderen': 'West Flanders', 'Oost-Vlaanderen': 'East Flanders', Antwerpen: 'Antwerp', Limburg: 'Limburg',
  'Vlaams-Brabant': 'Flemish Brabant', Brussel: 'Brussels', 'Waals-Brabant': 'Walloon Brabant', Henegouwen: 'Hainaut',
  Luik: 'Liège', Namen: 'Namur', Luxemburg: 'Luxembourg', Overig: 'Other',
};
// Cities we already know; anything else is looked up from its coordinates.
const STAD: Record<string, string> = {
  Brugge: 'West-Vlaanderen', Diksmuide: 'West-Vlaanderen', Ieper: 'West-Vlaanderen', Kortemark: 'West-Vlaanderen',
  Kortrijk: 'West-Vlaanderen', Ledegem: 'West-Vlaanderen', Middelkerke: 'West-Vlaanderen', Oostende: 'West-Vlaanderen',
  Poperinge: 'West-Vlaanderen', Roeselare: 'West-Vlaanderen', Tielt: 'West-Vlaanderen', Esen: 'West-Vlaanderen',
  Gent: 'Oost-Vlaanderen', Ghent: 'Oost-Vlaanderen', 'Sint-Lievens-Houtem': 'Oost-Vlaanderen',
  Antwerpen: 'Antwerpen', Essen: 'Antwerpen', Grobbendonk: 'Antwerpen', Hamont: 'Limburg', 'Hamont-Achel': 'Limburg',
  Grimbergen: 'Vlaams-Brabant', Brussel: 'Brussel', Bruxelles: 'Brussel', Brussels: 'Brussel',
  Tubize: 'Waals-Brabant', 'Komen-Waasten': 'Henegouwen',
};
// What OpenStreetMap calls the provinces (in Dutch, French or English)
const OSM: [RegExp, string][] = [
  [/west.?vla|flandre.occ|west flanders/i, 'West-Vlaanderen'], [/oost.?vla|flandre.or|east flanders/i, 'Oost-Vlaanderen'],
  [/antw|anvers/i, 'Antwerpen'], [/limb/i, 'Limburg'], [/vlaams.?brab|brabant flamand|flemish brabant/i, 'Vlaams-Brabant'],
  [/brus|brux/i, 'Brussel'], [/waals.?brab|brabant wallon|walloon brabant/i, 'Waals-Brabant'], [/hainaut|henegouw/i, 'Henegouwen'],
  [/li[eè]ge|luik/i, 'Luik'], [/namur|namen/i, 'Namen'], [/luxemb/i, 'Luxemburg'],
];

async function lookup(p: Place): Promise<string> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${p.lat}&lon=${p.lng}`, { signal: AbortSignal.timeout(5000) });
    const props = (await res.json()).features?.[0]?.properties ?? {};
    const name = [props.state, props.county].filter(Boolean).join(' ');
    return OSM.find(([re]) => re.test(name))?.[1] ?? 'Overig';
  } catch {
    return 'Overig';
  }
}

/** Province for each Belgian place (by index), in Dutch. */
export async function provincies(places: Place[]): Promise<Record<number, string>> {
  const out: Record<number, string> = {};
  await Promise.all(
    places.map(async (p, i) => {
      if (p.country !== 'België') return;
      const stad = p.city.replace(/\s*\(.*\)$/, '');
      const binnen = p.city.match(/\((.*)\)/)?.[1] ?? '';
      out[i] = STAD[p.city] ?? STAD[stad] ?? STAD[binnen] ?? (await lookup(p));
    }),
  );
  return out;
}
export const provincieIn = (prov: string, lang: 'nl' | 'en') => (lang === 'en' ? (PROVINCIE_EN[prov] ?? prov) : prov);
