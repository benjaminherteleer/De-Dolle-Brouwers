import type { ImageMetadata } from 'astro';
import data from '../data/bieren.json';

export type Bier = (typeof data)[number] & {
  art: ImageMetadata;
  poster?: ImageMetadata;
  /** Studio photo of the bottle with a filled glass. */
  fles?: ImageMetadata;
  color: string;
  onColor: string;
  /** Colour of the polka-dot bow on the bottle neck, where the beer has one. */
  strik?: string;
};

const art = import.meta.glob<{ default: ImageMetadata }>('../assets/bieren/*.png', { eager: true });
const flessen = import.meta.glob<{ default: ImageMetadata }>('../assets/flessen/*.jpg', { eager: true });
const posters = import.meta.glob<{ default: ImageMetadata }>('../assets/affiches/*.jpg', { eager: true });
const pick = (map: typeof art, file: string) => map[file]?.default;

/** Character drawing, poster and label colour for each beer. */
const look: Record<string, { art: string; poster?: string; color: string; onColor?: string; strik?: string }> = {
  oerbier: { art: 'oerbier', poster: 'oerbier', color: '#d6232a', onColor: '#fbf5ea', strik: '#d6232a' },
  arabier: { art: 'arabier', poster: 'arabier', color: '#f5c518', strik: '#f5c518' },
  'stille-nacht': { art: 'stille-nacht', poster: 'stille-nacht', color: '#2a62c9', onColor: '#fbf5ea', strik: '#2a62c9' },
  boskeun: { art: 'boskeun', poster: 'boskeun', color: '#3fae49', onColor: '#fbf5ea', strik: '#3fae49' },
  'dulle-teve': { art: 'dulle-teve', poster: 'dulle-teve', color: '#6a3aa8', onColor: '#fbf5ea', strik: '#6a3aa8' },
  'lichtervelds-blond': { art: 'dehoop-logo', color: '#f5c518', strik: '#f5c518' },
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
    strik: l.strik,
    fles: b.reserva ? undefined : pick(flessen, `../assets/flessen/${b.slug}.jpg`),
  };
});

export const vast = bieren.filter((b) => !b.reserva);
export const reserva = bieren.filter((b) => b.reserva);

export const short = (b: Bier) => b.meta.find((m) => m.label === 'Stijl')?.value ?? '';
export const abv = (b: Bier) => b.meta.find((m) => m.label === 'Alcohol')?.value ?? '';
