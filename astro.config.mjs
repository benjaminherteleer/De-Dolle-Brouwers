// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.oerbier.be',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  build: { format: 'file' },
  // Pages stay static; only the /api routes run on Vercel.
  adapter: vercel(),
  integrations: [mdx(), sitemap({ filter: (page) => !page.includes('/beheer') })],
});
