// Which photo goes where. Ids are source numbers (strings) present in src/generated/images.json.
// Duplicates (36, 38, 58, 63, 82, 91, 95) and the info screenshot (154) are never used.
// "photos" = clean photography (usable as full-bleed backgrounds and marquee tiles).
// "posters" = designed graphics with text (show contained, never as a darkened background).
// Order inside every list is best first.

const ids = (...n) => n.map(String);

const media = {
  heroVideo: { mp4: '/media/hero-loop.mp4', webm: '/media/hero-loop.webm', poster: '/media/hero-loop.jpg', width: 1280, height: 720, seconds: 8 },
  drinksLoop: { webp: '/media/drinks-loop.webp', gif: '/media/drinks-loop.gif', mp4: '/media/drinks-loop.mp4', width: 360, height: 360, gifWidth: 220 },
};

const brand = {
  logoBlack: '/brand/logo-black.png',
  logoWhite: '/brand/logo-white.png',
  logoBlackSvg: '/brand/logo-black.svg',
  logoWhiteSvg: '/brand/logo-white.svg',
  logoSize: { width: 1200, height: 728 },
  logoBlackSmall: '/brand/logo-black-480.webp', // 480x291, ~23 KB: use in nav/footer/splash
  logoWhiteSmall: '/brand/logo-white-480.webp',
  logoSmallSize: { width: 480, height: 291 },
  markWhite: '/brand/mark-white.png',
  markWhiteSvg: '/brand/mark-white.svg',
  markBlack: '/brand/mark-black.png',
  markSize: { width: 449, height: 600 },
  icon512: '/brand/icon-512.png',
  ogCard: '/brand/og-card.jpg',
  logoPhotos: ids(87, 125, 26), // 87 paper mockup is the nicest showcase shot
  cover: '126', // Facebook cover banner (text heavy)
};

const food = {
  hero: '77',
  bg: ids(6, 57, 77),
  photos: {
    signature: ids(6, 3, 5, 4, 7, 10, 9, 8),
    filipino: ids(77, 76, 75, 72, 81, 66, 73, 74),
    seafoodAndSushi: ids(60, 65, 64, 62, 105, 78, 79),
    snacksAndGrill: ids(57, 59, 71, 139),
  },
  posters: {
    pasta: ids(148, 131, 14, 16),
    filipino: ids(142, 145, 140, 137, 138, 132, 133, 33, 15),
    rice: ids(152, 153),
    snacks: ids(151, 150, 147),
    desserts: ids(17, 18),
    healthy: ids(92, 93, 97),
  },
  rows: [
    ids(6, 77, 3, 76, 5, 81, 4, 72, 7, 10),
    ids(60, 65, 57, 75, 64, 9, 105, 66, 62, 8),
    ids(148, 142, 152, 131, 145, 153, 140, 151, 137, 150, 132, 147, 133, 138),
  ],
};

const drinks = {
  hero: '29',
  bg: ids(29, 104, 54),
  photos: ids(29, 104, 54),
  coffee: ids(106, 85, 96, 94),
  milk: ids(107, 149),
  // Older boards 25, 83 and 84 show superseded prices, so they are not used next to the menu.
  specials: ids(107, 19),
  sodaAndYakult: ids(108, 146, 124),
  cocktails: ids(144, 127, 11, 123, 111),
  beer: ids(135, 136, 134),
  rows: [
    ids(144, 149, 146, 127, 124, 11),
    ids(135, 104, 136, 29, 94, 19),
  ],
};

const offers = {
  hero: '105',
  bg: ids(105, 130),
  featured: '128',
  posters: ids(128, 141, 143, 129, 130, 30, 31, 123, 111, 134, 98, 90, 32, 34, 68, 19),
  byOffer: {
    'unli-wings': ids(128, 141, 143, 129, 130),
    'unli-rice': ids(30, 31),
    'happy-hour': ids(123, 111),
    'beer-bucket': ids(134),
    'burger-fries': ids(98),
    combo: ids(90),
    bilao: ids(34, 32),
    'main-course': ids(68),
    'specials-30': ids(19),
  },
  comingSoon: ids(12, 13),
  rows: [ids(128, 123, 30, 134, 98, 141, 111), ids(90, 143, 31, 129, 32, 130, 68)],
};

const events = {
  hero: '55',
  bg: ids(55, 70, 117),
  packages: ids(112, 113, 114),
  venue: ids(55, 70, 122, 121, 117, 116, 118, 48),
  people: ids(119, 61, 69, 37, 115, 120),
  rows: [ids(122, 55, 121, 70, 117, 48, 116), ids(119, 61, 69, 37, 115, 120)],
};

const gallery = {
  hero: '118',
  bg: ids(118, 116, 39),
  photos: {
    bar: ids(39, 41, 53, 54, 42, 52),
    dining: ids(116, 118, 50, 47, 55, 48, 51, 28, 70, 117),
    lounge: ids(43, 46, 45, 49, 56),
    outside: ids(44, 20, 40, 29),
    people: ids(61, 119, 69, 37, 115, 120, 67),
  },
  rows: [
    ids(39, 116, 47, 53, 118, 41, 50, 117, 54),
    ids(43, 44, 55, 46, 28, 20, 48, 45, 70, 51),
    ids(61, 119, 69, 37, 115, 120, 49, 56, 40),
  ],
};

const visit = {
  hero: '20',
  bg: ids(20, 44),
  mapFacade: '44', // daylight storefront with the big round sign, used behind the click to load map
  exterior: ids(20, 44, 40),
  interior: ids(116, 50, 39),
  review: '80',
};

const menu = {
  hero: '53',
  bg: ids(53, 39),
  // Poster boards per menu.js section key, for "view the original board" lightboxes.
  posters: {
    'main-course': ids(21),
    platters: ids(22, 23, 24),
    'rice-meals': ids(86, 100, 101, 102, 103),
    pasta: ids(35, 110),
    'pansit-bilao': ids(32),
    appetizers: ids(109),
    snacks: ids(99, 88, 89),
    soup: ids(93),
    healthy: ids(92),
    veggie: ids(97),
    coffee: ids(106, 85, 96),
    milk: ids(107),
    specials: ids(107),
    soda: ids(108),
    yakult: ids(108),
    cocktails: ids(123, 111),
    beer: ids(134),
    'unli-wings': ids(128, 143),
  },
  boards: ids(21, 22, 23, 24, 32, 35, 86, 100, 101, 102, 103, 106, 107, 108, 109, 110, 99, 88, 92, 93, 97, 85, 96),
};

const home = {
  hero: '57', // dark overhead spaghetti: strong contrast for white type, matches the video poster
  heroAlt: ids(118, 6, 39),
  bgRows: [
    ids(6, 77, 60, 3, 81, 4, 76, 5, 7, 72, 10, 65),
    ids(39, 118, 116, 47, 53, 117, 41, 44, 50, 54, 20),
  ],
  highlights: {
    menu: { id: '106', label: 'Menu', href: '/menu/', poster: true },
    food: { id: '6', label: 'Food', href: '/food/' },
    drinks: { id: '29', label: 'Drinks', href: '/drinks/' },
    offers: { id: '128', label: 'Offers', href: '/offers/', poster: true },
    events: { id: '122', label: 'Events', href: '/events/' },
    gallery: { id: '118', label: 'The Place', href: '/gallery/' },
    visit: { id: '20', label: 'Visit', href: '/visit/' },
  },
  story: '47', // brick mural with the logo: "who we are" panel background
  visit: '20',
  review: '80',
  logoShowcase: '87',
};

const categories = {
  food: { label: 'Food', ids: [...new Set([...Object.values(food.photos).flat(), ...Object.values(food.posters).flat()])] },
  drinks: { label: 'Drinks', ids: [...new Set([...drinks.photos, ...drinks.coffee, ...drinks.milk, ...drinks.specials, ...drinks.sodaAndYakult, ...drinks.cocktails, ...drinks.beer])] },
  menu: { label: 'Menu', ids: menu.boards },
  offers: { label: 'Offers', ids: offers.posters },
  comingSoon: { label: 'Coming Soon', ids: offers.comingSoon },
  events: { label: 'Events', ids: [...events.packages, ...events.venue] },
  place: { label: 'The Place', ids: [...new Set(Object.values(gallery.photos).filter((_, i) => i < 4).flat())] },
  people: { label: 'Guests', ids: gallery.photos.people },
  healthy: { label: 'Healthy', ids: food.posters.healthy },
  location: { label: 'Visit', ids: visit.exterior },
  logos: { label: 'Brand', ids: brand.logoPhotos },
  reviews: { label: 'Reviews', ids: ids(80) },
};

export const curation = { media, brand, home, menu, food, drinks, offers, events, gallery, visit, categories };
