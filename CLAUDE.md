# Oerbier / De Dolle Brouwers

Astro site, deployed on Vercel from GitHub (push to `main` = deploy).

- Node lives in `~/.local/node/bin`; package manager is pnpm.
- Pages: `src/pages` (beer pages under `src/pages/bieren`). Every page uses `src/layouts/Base.astro`, which renders `Nav` and `Footer` from `src/components`.
- Each page keeps its own styles in a `<style is:global>` block at the bottom; inline scripts use `is:inline`.
- Images are served from `public/images` (`/images/...`).
- Dev server: `pnpm dev`, build: `pnpm build`.
