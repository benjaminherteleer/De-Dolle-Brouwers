// Builds public/llms-full.txt: the readable text of the main English pages in one file, for AI assistants.
// Run after `pnpm build`:  node scripts/llms-full.mjs   (then `pnpm build` again so the file is published)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const site = 'https://www.dedollebrouwers.be';
const pages = [
  ['/en/visit', 'Visit the brewery and the Oerbar'],
  ['/en/book-a-tour', 'Book a brewery tour'],
  ['/en/faq', 'FAQ'],
  ['/en/our-story', 'Our story'],
  ['/en/brewing', 'How we brew'],
  ...['oerbier', 'arabier', 'boskeun', 'dulle-teve', 'stille-nacht', 'export-stout', 'lichtervelds-blond', 'oeral', 'oerbier-reserva', 'dulle-teve-reserva', 'stille-nacht-reserva'].map((s) => [`/en/beers/${s}`, null]),
];

const read = (path) => {
  for (const f of [`dist/client${path}.html`, `dist/client${path}/index.html`]) if (existsSync(f)) return readFileSync(f, 'utf8');
  return null;
};
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

function mainText(html) {
  const m = html.match(/<main[\s\S]*?<\/main>/i);
  let h = m ? m[0] : html;
  h = h.replace(/<(script|style|svg|noscript|form|button|nav|footer)[\s\S]*?<\/\1>/gi, '');
  const one = (t) => t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  h = h.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, t) => `\n\n## ${one(t)}\n`).replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n### ${one(t)}\n`).replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n#### ${one(t)}\n`);
  h = h.replace(/<li[^>]*>/gi, '\n- ').replace(/<\/(p|div|section|tr|dt|dd|figcaption)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');
  h = decode(h.replace(/<[^>]+>/g, ' '));
  return h
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter((l, i, a) => l || (a[i - 1] && a[i - 1] !== ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const head = readFileSync('public/llms.txt', 'utf8').split('\n## ')[0].trim();
const out = [head, '', `Full text of the main pages below (English). Short version: ${site}/llms.txt. Generated from the live site, so check the page itself for the latest.`];
for (const [path, title] of pages) {
  const html = read(path);
  if (!html) { console.warn('missing', path); continue; }
  const t = html.match(/<title>([\s\S]*?)<\/title>/i);
  out.push('', `# ${title ?? decode(t ? t[1] : path).split('|')[0].trim()}`, `Source: ${site}${path}`, '', mainText(html));
}
writeFileSync('public/llms-full.txt', out.join('\n') + '\n');
console.log('public/llms-full.txt', out.join('\n').length, 'characters');
