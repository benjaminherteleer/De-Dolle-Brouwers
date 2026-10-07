import type { ImageMetadata } from 'astro';
import { euro, type Product } from './shopify';

/** The personalised figurine is ordered through the maker page, not a product page. */
export const CUSTOM = 'oerbier-mannetje-op-maat';
const ORDER = ['trui-zwart', 'crewneck-grijs', 't-shirt-de-bende', 'pet', 'oerbier-mannetje', CUSTOM, 'metalen-bord', 'oerbier-glas-charente', 'oeral-glas', 'oerbier-glas-klein'];

export const sortProducts = (list: Product[]) => {
  const rank = (h: string) => (ORDER.includes(h) ? ORDER.indexOf(h) : ORDER.length);
  return [...list].sort((a, b) => rank(a.handle) - rank(b.handle));
};

// Our own photos per product: src/assets/shop/<handle>-<n>.jpg. Products without them use Shopify's images.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/shop/*.jpg', { eager: true });
export const gallery = (handle: string): ImageMetadata[] =>
  Object.entries(files)
    .map(([path, mod]) => ({ m: path.match(/\/([a-z0-9-]+)-(\d+)\.jpg$/), img: mod.default }))
    .filter((x) => x.m?.[1] === handle)
    .sort((a, b) => Number(a.m![2]) - Number(b.m![2]))
    .map((x) => x.img);

export const priceLabel = (p: Product) =>
  p.priceRange.minVariantPrice.amount === p.priceRange.maxVariantPrice.amount
    ? euro(p.priceRange.minVariantPrice)
    : `vanaf ${euro(p.priceRange.minVariantPrice)}`;

/** Options worth showing (Shopify adds a dummy "Title" option to single-variant products). */
export const realOptions = (p: Product) => p.options.filter((o) => !(o.name === 'Title' && o.optionValues.length === 1));

export const shopifyImage = (url: string, width: number) => `${url}${url.includes('?') ? '&' : '?'}width=${width}`;

/** Which gallery photo (0-based) belongs to an option value, so picking a design shows that design. */
export const variantPhotos: Record<string, Record<string, number>> = {
  'metalen-bord': { Oerbier: 6, Arabier: 2, Boskeun: 3, 'Dulle Teve': 4, 'Stille Nacht': 5, Stout: 9, 'Oerbier rotstekening': 9 },
};
