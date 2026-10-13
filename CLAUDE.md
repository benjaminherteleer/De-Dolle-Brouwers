# Oerbier / De Dolle Brouwers

Astro site, deployed on Cloudflare from GitHub (adapter `@astrojs/cloudflare`, config in `wrangler.jsonc`). The Cloudflare setup lives on the `cloudflare` branch; Vercel (from `main`) was the old host.

- Node lives in `~/.local/node/bin`; package manager is pnpm.
- Dev server: `pnpm dev`, build: `pnpm build`.

## Structure

- `src/layouts/Base.astro` renders `Nav` and `Footer` and imports `src/styles/global.css` for every page.
- `src/styles/global.css` holds the look: paper/ink/yellow tokens, Fraunces (soft, chunky) + Caveat Brush (handwritten), and shared pieces like `.btn`, `.pill`, `.tag`, `.polaroid`, `.card`, `.stamp`, `.ticker`, torn edges (`.edge-top` / `.edge-bottom`).
- `src/components/Polaroid.astro` (taped/tilted photo) and `Stamp.astro` (round rotating badge).
- Beers: content in `src/data/bieren.json`, colours/drawings/posters in `src/lib/bieren.ts`, one template at `src/pages/bieren/[slug].astro`.
- Domain: https://www.dedollebrouwers.be (oerbier.be is no longer used). Canonical URLs come from `Base.astro`; brewery/tour structured data from `src/lib/schema.ts`.
- `index`, `brouwerij` and `brouwproces` are built on the new design. `contact`, `faq`, `rondleiding-boeken` and `verkooppunten-kaart` still carry their older page styles in a `<style is:global>` block, mapped onto the new tokens.

## Two languages (Dutch at `/`, English at `/en`)

- Each page's design lives once in `src/views/<Page>.astro`; `src/pages/x.astro` and `src/pages/en/<english-slug>.astro` are thin wrappers that render it.
- Texts sit next to each other in the view: `tr('Nederlands', 'English')`. Links go through `L('/dutch-path')`, which maps to the English URL (`src/i18n/index.ts` holds the URL map).
- Beer texts: `src/data/bieren.json` (NL) and `src/data/bieren.en.json` (EN, per slug); use `beers(lang)`. Shop texts: `src/data/producten.en.json`, option labels in `src/lib/shop.ts`.
- Client scripts check `document.documentElement.lang === 'en'`. Nav, Footer, CartDrawer, Shop and the map read the language from the URL.
- When changing Dutch text, change the English next to it. News: Dutch editions in `src/content/nieuws`, English ones with the same file name in `src/content/nieuws-en` (masthead stays as is).

## Images

- Put images in `src/assets/` and use `astro:assets` (`<Image>` / `Polaroid`) so they are resized to webp at build.
  - `foto/` photos, `brouwproces/` step drawings cut from the Instagram carousel, `affiches/` posters, `bieren/` beer characters, `logo/`.
- `public/images` only holds files referenced by plain URL from the older pages.
- Source material lives in `~/Downloads/De Dolle Brouwers/` (Foto's, Etiketten, Instagram brewing slides `NN_DeDolle_brewing.jpg`).

## Oerbier Fake Nieuws (`/nieuws`)

- One MDX file per monthly edition in `src/content/nieuws/` (file name = URL, e.g. `2026-10-stille-nacht-reserva-2024.mdx`). Schema in `src/content.config.ts`: `titel`, `datum`, `kicker`, `stempel`, `lead` (also the Google description), `kleur` (geel/blauw/rood/groen), `foto`, `fotoAlt`.
- Building blocks in `src/components/nieuws/`: `Artikel` (label, titel, sub, foto, donker, rechts), `Kader`, `Citaat`, `Markeer`, `Cijfers`, `Prijzen` (the for-sale box; opening hours are built in), `Origineel` (Kris's handwritten version), `Knop`.
- Photos per edition go in `src/assets/nieuws/<jjjj-mm>/`. Keep the user's text exactly as written; only the layout is ours.
