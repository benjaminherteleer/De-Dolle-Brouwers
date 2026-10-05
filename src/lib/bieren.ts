import type { ImageMetadata } from 'astro';
import data from '../data/bieren.json';

export type Bier = (typeof data)[number] & {
  art: ImageMetadata;
  poster?: ImageMetadata;
  color: string;
  onColor: string;
};

const art = import.meta.glob<{ default: ImageMetadata }>('../assets/bieren/*.png', { eager: true });
const posters = import.meta.glob<{ default: ImageMetadata }>('../assets/affiches/*.jpg', { eager: true });
const pick = (map: typeof art, file: string) => map[file]?.default;

/** Character drawing, poster and label colour for each beer. */
const look: Record<string, { art: string; poster?: string; color: string; onColor?: string }> = {
  oerbier: { art: 'oerbier', poster: 'oerbier', color: '#f7b500' },
  arabier: { art: 'arabier', poster: 'arabier', color: '#e2412b', onColor: '#fbf5ea' },
  'stille-nacht': { art: 'stille-nacht', poster: 'stille-nacht', color: '#bcdcf2' },
  boskeun: { art: 'boskeun', poster: 'boskeun', color: '#f7a541' },
  'dulle-teve': { art: 'dulle-teve', poster: 'dulle-teve', color: '#8db3e8' },
  'lichtervelds-blond': { art: 'dehoop-logo', color: '#f5cd47' },
  'export-stout': { art: 'stout-logo', color: '#1c1813', onColor: '#fbf5ea' },
  oeral: { art: 'oeral', color: '#ffe17a' },
  'oerbier-reserva': { art: 'oerbier', color: '#1d1812', onColor: '#fbf5ea' },
  'dulle-teve-reserva': { art: 'dulle-teve', color: '#1d1812', onColor: '#fbf5ea' },
  'stille-nacht-reserva': { art: 'stille-nacht', color: '#1d1812', onColor: '#fbf5ea' },
};

export const bieren: Bier[] = data.map((b) => {
  const l = look[b.slug];
  return {
    ...b,
    art: pick(art, `../assets/bieren/${l.art}.png`)!,
    poster: l.poster ? pick(posters, `../assets/affiches/${l.poster}.jpg`) : undefined,
    color: l.color,
    onColor: l.onColor ?? '#21170c',
  };
});

export const vast = bieren.filter((b) => !b.reserva);
export const reserva = bieren.filter((b) => b.reserva);

export const short = (b: Bier) => b.meta.find((m) => m.label === 'Stijl')?.value ?? '';
export const abv = (b: Bier) => b.meta.find((m) => m.label === 'Alcohol')?.value ?? '';
