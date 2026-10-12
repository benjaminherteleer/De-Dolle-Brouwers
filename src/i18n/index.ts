/**
 * Two languages: Dutch at the root, English under /en. Each page has one design (a view in
 * src/views) with a Dutch and an English set of texts; this file maps the URLs between them.
 */
export type Lang = 'nl' | 'en';

/** Dutch path → English path for pages that exist in both languages. */
const pages: Record<string, string> = {
  '/': '/en',
  '/brouwerij': '/en/visit',
  '/rondleiding-boeken': '/en/book-a-tour',
  '/verhaal': '/en/our-story',
  '/brouwproces': '/en/brewing',
  '/oershop': '/en/shop',
  '/oerbier-mannetje': '/en/oerbier-figure',
  '/verkooppunten-kaart': '/en/where-to-drink',
  '/contact': '/en/contact',
  '/faq': '/en/faq',
};
const prefixes: [string, string][] = [
  ['/bieren/', '/en/beers/'],
  ['/oershop/', '/en/shop/'],
];
const toNlPages = Object.fromEntries(Object.entries(pages).map(([nl, en]) => [en, nl]));

const clean = (path: string) => path.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';

export const langOf = (url: URL | string): Lang => {
  const p = clean(typeof url === 'string' ? url : url.pathname);
  return p === '/en' || p.startsWith('/en/') ? 'en' : 'nl';
};

/** The same page in the other language, or undefined when it only exists in one. */
export function counterpart(path: string): string | undefined {
  const p = clean(path);
  if (langOf(p) === 'en') {
    if (toNlPages[p]) return toNlPages[p];
    const pre = prefixes.find(([, en]) => p.startsWith(en));
    return pre ? pre[0] + p.slice(pre[1].length) : undefined;
  }
  if (pages[p]) return pages[p];
  const pre = prefixes.find(([nl]) => p.startsWith(nl));
  return pre ? pre[1] + p.slice(pre[0].length) : undefined;
}

/** Turn a Dutch link (optionally with #hash) into the link for the given language. */
export function link(lang: Lang, nlHref: string): string {
  if (lang === 'nl' || !nlHref.startsWith('/')) return nlHref;
  const [path, hash] = nlHref.split('#');
  const en = counterpart(path || '/') ?? path;
  return hash ? `${en}#${hash}` : en;
}

/** Pick the text for the current language from a { nl, en } pair. */
export const pick = <T>(lang: Lang, texts: { nl: T; en: T }): T => texts[lang];
