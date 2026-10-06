// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.oerbier.be',
  trailingSlash: 'never',
  devToolbar: { enabled: false },
  build: { format: 'file' },
  // Pages stay static; only the /api routes run on Vercel.
  adapter: vercel(),
  integrations: [sitemap({ filter: (page) => !page.includes('/beheer') })],
});
