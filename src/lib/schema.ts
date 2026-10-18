/**
 * Structured data (schema.org) for the brewery: address, opening hours of the Oerbar
 * and the Sunday tours, so search engines can show them. Used on the home and visit pages.
 */
import gesloten from '../data/gesloten.json';

const site = 'https://www.dedollebrouwers.be';

export const brewery = (lang: 'nl' | 'en' = 'nl') => ({
  '@context': 'https://schema.org',
  '@type': ['Brewery', 'TouristAttraction'],
  '@id': `${site}/#brouwerij`,
  name: 'De Dolle Brouwers',
  alternateName: 'Oerbier',
  url: lang === 'en' ? `${site}/en` : `${site}/`,
  description:
    lang === 'en'
      ? 'Craft brewery in Esen (Diksmuide), West Flanders, since 1980. Known for Oerbier, Arabier, Boskeun, Dulle Teve, Stille Nacht, Export Stout and Oeral. Brewery tour every Sunday, taproom open on weekends.'
      : 'Ambachtelijke specialiteitsbrouwerij in Esen (Diksmuide), West-Vlaanderen, sinds 1980. Bekend van Oerbier, Arabier, Boskeun, Dulle Teve, Stille Nacht, Export Stout en Oeral. Rondleiding elke zondag, Oerbar open in het weekend.',
  foundingDate: '1980',
  email: 'info@dedollebrouwers.be',
  image: `${site}/apple-touch-icon.png`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Roeselarestraat 12B',
    postalCode: '8600',
    addressLocality: 'Esen (Diksmuide)',
    addressRegion: lang === 'en' ? 'West Flanders' : 'West-Vlaanderen',
    addressCountry: 'BE',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 51.0279189, longitude: 2.9032152 },
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Saturday', 'Sunday'], opens: '14:00', closes: '19:00' },
  ],
  isAccessibleForFree: true,
  publicAccess: true,
  tourBookingPage: lang === 'en' ? `${site}/en/book-a-tour` : `${site}/rondleiding-boeken`,
  sameAs: [
    'https://www.instagram.com/dedollebrouwers',
    'https://www.facebook.com/dedollebrouwers',
    'https://www.tiktok.com/@dedollebrouwers',
    'https://en.wikipedia.org/wiki/De_Dolle_Brouwers',
  ],
  event: tours(lang),
});

/** Closed Sundays: one-off dates in gesloten.json, plus the Christmas closure (22 December – 18 January). */
const dicht = (d: Date) => {
  const iso = d.toISOString().slice(0, 10);
  if (gesloten.some((g) => g.datum === iso)) return true;
  const md = iso.slice(5);
  return md >= '12-22' || md <= '01-18';
};

// "+01:00" or "+02:00": Brussels time on that day (winter/summer time)
const offset = (d: Date) => {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Brussels', timeZoneName: 'shortOffset' }).formatToParts(d).find((p) => p.type === 'timeZoneName')!.value;
  const h = Number(name.replace('GMT', '') || 0);
  return `${h < 0 ? '-' : '+'}${String(Math.abs(h)).padStart(2, '0')}:00`;
};

/**
 * The Sunday tours (14:00 in English, 15:00 in Dutch, €10 with three tastings) as dated events for the
 * coming weeks: Google only accepts events with a real start date. Recomputed on every build.
 */
export const tours = (lang: 'nl' | 'en' = 'nl', weeks = 8) => {
  const sundays: Date[] = [];
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  while (sundays.length < weeks) {
    if (!dicht(d)) sundays.push(new Date(d));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  const url = lang === 'en' ? `${site}/en/book-a-tour` : `${site}/rondleiding-boeken`;
  return sundays.flatMap((day) => {
    const date = day.toISOString().slice(0, 10);
    const tz = offset(day);
    return [
      { time: '14:00', end: '14:45', inLanguage: 'en', nl: 'Rondleiding in het Engels', en: 'Brewery tour in English' },
      { time: '15:00', end: '15:45', inLanguage: 'nl', nl: 'Rondleiding in het Nederlands', en: 'Brewery tour in Dutch' },
    ].map((t) => ({
      '@type': 'Event',
      name: `${t[lang]} · De Dolle Brouwers`,
      description:
        lang === 'en'
          ? 'About 45 minutes through the working brewery, with three tastings straight from the cask.'
          : 'Ongeveer drie kwartier door de werkende brouwerij, met drie proevertjes van het vat.',
      inLanguage: t.inLanguage,
      startDate: `${date}T${t.time}:00${tz}`,
      endDate: `${date}T${t.end}:00${tz}`,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      image: [`${site}/og/rondleiding.jpg`],
      location: {
        '@type': 'Place',
        name: 'De Dolle Brouwers',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Roeselarestraat 12B',
          addressLocality: 'Esen (Diksmuide)',
          postalCode: '8600',
          addressRegion: 'West-Vlaanderen',
          addressCountry: 'BE',
        },
      },
      organizer: { '@type': 'Organization', name: 'De Dolle Brouwers', url: site },
      offers: {
        '@type': 'Offer',
        price: '10',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        url,
      },
    }));
  });
};
