/**
 * Google Places text search, in the browser (tip form and /beheer). Finds bars, shops and importers
 * anywhere in the world, with coordinates, city and country in one call. Needs PUBLIC_GOOGLE_MAPS_KEY
 * (a browser key restricted to dedollebrouwers.be).
 */
export const GOOGLE_KEY = import.meta.env.PUBLIC_GOOGLE_MAPS_KEY as string | undefined;

export type Gevonden = { name: string; label: string; city: string; country: string; lat: number; lng: number };

const part = (components: any[] = [], ...types: string[]) => {
  for (const t of types) {
    // Some address parts (e.g. "Next to Journey" in the UK) come without types
    const c = components.find((c) => c.types?.includes(t));
    if (c) return c.longText as string;
  }
  return '';
};

export async function zoekBreed(q: string, lang: 'nl' | 'en'): Promise<Gevonden[]> {
  if (!GOOGLE_KEY) return [];
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.addressComponents',
    },
    body: JSON.stringify({ textQuery: q, languageCode: lang, pageSize: 10 }),
  });
  if (!res.ok) throw new Error(String(res.status));
  const data = await res.json();
  return (data.places ?? []).map((p: any) => ({
    name: p.displayName?.text ?? q,
    label: [p.displayName?.text, p.formattedAddress].filter(Boolean).join(', '),
    city: part(p.addressComponents, 'locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2'),
    country: part(p.addressComponents, 'country'),
    lat: p.location.latitude,
    lng: p.location.longitude,
  }));
}
