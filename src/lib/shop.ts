import type { ImageMetadata } from 'astro';
import productenEn from '../data/producten.en.json';
import { euro, type Product } from './shopify';

/** The personalised figurine is ordered through the maker page, not a product page. */
export const CUSTOM = 'oerbier-mannetje-op-maat';
const ORDER = ['trui-zwart', 'crewneck-grijs', 't-shirt-de-bende', 'pet', 'oerbier-mannetje', CUSTOM, 'metalen-bord', 'oerbier-glas-charente', 'oeral-glas', 'oerbier-glas-klein'];

/** Tour tickets are a Shopify product too, but they are sold on the booking page, not in the shop. */
export const TICKET = 'rondleiding';
/**
 * Pay for tour tickets online. Keep false until Shopify Payments is active:
 * until then the booking page reserves by email and people pay on the spot.
 */
export const TICKETS_BETALEN = false;

export const sortProducts = (list: Product[]) => {
  const rank = (h: string) => (ORDER.includes(h) ? ORDER.indexOf(h) : ORDER.length);
  return [...list].filter((p) => p.handle !== TICKET).sort((a, b) => rank(a.handle) - rank(b.handle));
};

// Our own photos per product: src/assets/shop/<handle>-<n>.jpg. Products without them use Shopify's images.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/shop/*.jpg', { eager: true });
export const gallery = (handle: string): ImageMetadata[] =>
  Object.entries(files)
    .map(([path, mod]) => ({ m: path.match(/\/([a-z0-9-]+)-(\d+)\.jpg$/), img: mod.default }))
    .filter((x) => x.m?.[1] === handle)
    .sort((a, b) => Number(a.m![2]) - Number(b.m![2]))
    .map((x) => x.img);

export const priceLabel = (p: Product, lang: 'nl' | 'en' = 'nl') =>
  p.priceRange.minVariantPrice.amount === p.priceRange.maxVariantPrice.amount
    ? euro(p.priceRange.minVariantPrice)
    : `${lang === 'en' ? 'from' : 'vanaf'} ${euro(p.priceRange.minVariantPrice)}`;

/** Options worth showing (Shopify adds a dummy "Title" option to single-variant products). */
export const realOptions = (p: Product) => p.options.filter((o) => !(o.name === 'Title' && o.optionValues.length === 1));

export const shopifyImage = (url: string, width: number) => `${url}${url.includes('?') ? '&' : '?'}width=${width}`;

/** Which gallery photo (0-based) belongs to an option value, so picking a design shows that design. */
export const variantPhotos: Record<string, Record<string, number>> = {
  'metalen-bord': { Oerbier: 5, Arabier: 1, Boskeun: 2, 'Dulle Teve': 3, 'Stille Nacht': 4, Stout: 8, 'Oerbier rotstekening': 8 },
};

/** English texts for the shop: product titles and descriptions, option names and values. */
const optionNames: Record<string, string> = { Maat: 'Size', Model: 'Style', Ontwerp: 'Design' };
const optionValues: Record<string, string> = { 'Zonder rits': 'Without zip', 'Met rits': 'With zip', 'Oerbier rotstekening': 'Oerbier cave drawing' };
export const productText = (p: Product, lang: 'nl' | 'en') =>
  lang === 'en' ? { title: p.title, description: p.description, ...(productenEn as Record<string, { title: string; description: string }>)[p.handle] } : { title: p.title, description: p.description };
/** Label to show for an option name or value; the value sent to Shopify stays Dutch. */
export const optionLabel = (name: string, lang: 'nl' | 'en') => (lang === 'en' ? optionNames[name] ?? name : name);
export const valueLabel = (value: string, lang: 'nl' | 'en') => (lang === 'en' ? optionValues[value] ?? value : value);
