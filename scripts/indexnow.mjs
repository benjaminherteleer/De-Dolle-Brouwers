// Tells Bing (and other IndexNow search engines) which pages changed, so they pick them up quickly.
// Run after a deploy has finished:  node scripts/indexnow.mjs            (all pages from the sitemap)
//                                   node scripts/indexnow.mjs /bieren/oerbier /en  (only these paths)
const host = 'www.dedollebrouwers.be';
const key = 'e588d230eacf316d40b1378b17f159ae';

const site = `https://${host}`;
let urls = process.argv.slice(2).map((p) => (p.startsWith('http') ? p : site + (p.startsWith('/') ? p : '/' + p)));
if (!urls.length) {
  const xml = await (await fetch(`${site}/sitemap-0.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `${site}/${key}.txt`, urlList: urls }),
});
console.log(res.status, res.statusText, '-', urls.length, 'urls');
