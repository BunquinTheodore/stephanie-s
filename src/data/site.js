// Single source of truth for business info. Used by the vite include plugin
// (partials, meta, JSON-LD) and by browser modules. Plain data only, no imports.

export const site = {
  name: "Stefanie's Bar & Restaurant",
  shortName: "Stefanie's",
  tagline: 'Good food, good vibes. See you at Stefanie’s!',
  description:
    "Stefanie's Bar & Restaurant in Balagtas, Batangas City. All day comfort food, wings, pasta, rice meals, coffee and cocktails, open daily 8 AM to 10 PM.",
  // Absolute production origin without a trailing slash, e.g. "https://stefanies.ph".
  // Leave empty until the domain is known; SITE_URL env var overrides it at build.
  url: '',
  locale: 'en_PH',
  themeColor: '#0a0a0a',

  address: {
    line: 'Behind Total Gasoline Station',
    street: 'Diversion Rd. cor. Tramo',
    locality: 'Balagtas, Batangas City',
    region: 'Batangas',
    postalCode: '4200',
    country: 'PH',
    countryName: 'Philippines',
    full: 'Balagtas, Batangas City, Philippines 4200, behind Total Gasoline Station',
    plusCode: 'R329+4XR',
  },
  // Verified 2026-11: the owner's maps.app.goo.gl link resolves to plus code R329+4XR,
  // "Total, Diversion Rd. cor. Tramo, Balagtas"; these coordinates encode to 7Q53R329+4XR.
  geo: { lat: 13.800363, lng: 121.069891 },

  hours: {
    label: 'Daily, 8 AM to 10 PM',
    short: '8 AM to 10 PM',
    days: 'Open daily',
    opens: '08:00',
    closes: '22:00',
  },

  phone: { display: '0977 322 9072', href: 'tel:+639773229072', e164: '+639773229072' },
  email: 'rabbarrion209@gmail.com',

  links: {
    facebook: 'https://www.facebook.com/profile.php?id=100092012627583',
    messenger: 'https://m.me/100092012627583',
    maps: 'https://maps.app.goo.gl/LZkdiHGtYjagY3L2A',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=13.800363,121.069891',
    mapEmbed: 'https://www.google.com/maps?q=13.800363,121.069891&z=17&output=embed',
  },

  services: ['Reservations', 'Delivery', 'In-store pickup', 'Dine-in', 'Takeout', 'Online booking'],
  ordering: { note: 'Order online via GrabFood and Foodpanda.', partners: ['GrabFood', 'Foodpanda'] },
  priceRange: '$$',
  rating: { recommend: '100%', count: 11, source: 'Facebook' },
  copyrightYear: 2026,

  nav: [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'menu', label: 'Menu', href: '/menu/' },
    { key: 'food', label: 'Food', href: '/food/' },
    { key: 'drinks', label: 'Drinks', href: '/drinks/' },
    { key: 'offers', label: 'Offers', href: '/offers/' },
    { key: 'events', label: 'Events', href: '/events/' },
    { key: 'gallery', label: 'The Place', href: '/gallery/' },
    { key: 'visit', label: 'Visit', href: '/visit/' },
  ],
};

export default site;
