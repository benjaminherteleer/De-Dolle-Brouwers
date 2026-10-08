import { getCollection, type CollectionEntry } from 'astro:content';

export type Editie = CollectionEntry<'nieuws'>;

/** All editions, oldest first, with their running edition number. */
export async function edities(): Promise<(Editie & { nummer: number })[]> {
  const lijst = (await getCollection('nieuws')).sort((a, b) => a.data.datum.getTime() - b.data.datum.getTime());
  return lijst.map((e, i) => ({ ...e, nummer: i + 1 }));
}

export const maand = (d: Date) => {
  const s = d.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Colours per front page, matching the beer the edition is about. */
export const kleuren: Record<string, { bg: string; on: string }> = {
  geel: { bg: 'var(--yellow)', on: 'var(--ink)' },
  blauw: { bg: '#bcdcf2', on: 'var(--ink)' },
  rood: { bg: '#d6232a', on: '#fbf5ea' },
  groen: { bg: '#3fae49', on: '#fbf5ea' },
};
