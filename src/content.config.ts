import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Oerbier Fake Nieuws: one MDX file per edition in src/content/nieuws.
 * The file name is the URL: 2026-08-reserva-oerbier.mdx → /nieuws/2026-08-reserva-oerbier
 */
const nieuws = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/nieuws' }),
  schema: ({ image }) =>
    z.object({
      /** Headline of the edition */
      titel: z.string(),
      /** Publication date; the month shown on the page is taken from it */
      datum: z.coerce.date(),
      /** Small line above the headline */
      kicker: z.string().optional(),
      /** Red stamp next to the headline, e.g. "Bijna volledig uitverkocht!" */
      stempel: z.string().optional(),
      /** Sub-headline under the title; also the description for Google */
      lead: z.string(),
      /** Colour of the front page: geel (Oerbier) or blauw (Stille Nacht) */
      kleur: z.enum(['geel', 'blauw', 'rood', 'groen']).default('geel'),
      foto: image(),
      fotoAlt: z.string(),
    }),
});

export const collections = { nieuws };
