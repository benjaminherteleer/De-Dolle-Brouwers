/**
 * Structured data (schema.org) for the brewery: address, opening hours of the Oerbar
 * and the Sunday tours, so search engines can show them. Used on the home and visit pages.
 */
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

/** The weekly Sunday tours: 14:00 in English, 15:00 in Dutch, €10 with three tastings. */
export const tours = (lang: 'nl' | 'en' = 'nl') =>
  [
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
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventSchedule: {
      '@type': 'Schedule',
      byDay: 'https://schema.org/Sunday',
      repeatFrequency: 'P1W',
      startTime: t.time,
      endTime: t.end,
      scheduleTimezone: 'Europe/Brussels',
    },
    location: {
      '@type': 'Place',
      name: 'De Dolle Brouwers',
      address: 'Roeselarestraat 12B, 8600 Esen (Diksmuide), België',
    },
    offers: {
      '@type': 'Offer',
      price: '10',
      priceCurrency: 'EUR',
      url: lang === 'en' ? `${site}/en/book-a-tour` : `${site}/rondleiding-boeken`,
    },
  }));
