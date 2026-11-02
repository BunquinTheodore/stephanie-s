// Stefanie's Bar & Restaurant menu, transcribed from the owner's menu posters.
// Prices are numbers in Philippine pesos (render with the peso sign, e.g. `₱${price}`).
// A price is omitted wherever the poster shows none. Nothing here is invented.
// `src` lists the poster image ids each section was read from (see docs/image-catalog.json).
// Drinks use the Coffee/Milk/Soda series boards (106, 107, 108), which are the most complete
// and mutually consistent price set. Older boards (25, 83, 84) show different prices and are
// kept only as imagery.

export const menu = [
  {
    key: 'main-course',
    title: 'Main Course',
    src: ['21', '68'],
    items: [
      { name: 'Shrimp Salvatore', price: 218, desc: 'Succulent shrimp sauteed in garlic, white wine and a zesty tomato basil sauce.' },
      { name: 'Mango Thermidor Prawns', price: 218, desc: 'Baked prawns in a luxurious Thermidor cream, topped with a light, fruity mango emulsion.' },
      { name: 'Crispy Cream Dory a la Pobre', price: 210, desc: 'Golden fried cream dory paired with a bold and aromatic a la pobre blend.' },
      { name: 'Mozza Melt Burger Steak', price: 248, desc: 'Juicy burger steak stuffed with melted mozzarella and topped with savory gravy.' },
      { name: "Stefanie's Country Style Roast Beef", price: 260, desc: 'Slow roasted beef served with creamy, buttery mashed potatoes.' },
      { name: 'Pepper Glazed Chicken Roulade', price: 250, desc: 'Delicate chicken roulade paired with a flavorful green pepper dressing.' },
      { name: 'Grilled Chicken with Onion Veloute', price: 230, desc: 'Juicy grilled breast served with a smooth, caramelized onion puree.' },
      { name: 'Braised Pork Ribs', price: 245, desc: 'Juicy, flavorful pork ribs braised to perfection with aromatic herbs and spices.' },
      { name: 'Lemon Garlic Glazed Salmon', price: 295, desc: 'Garlic and lemon kissed salmon, rich and flavorful in every bite.' },
      { name: 'Gata Infused Sinuglaw', price: 280, desc: 'Smoky grilled pork and yellowfin kinilaw blended with smooth, flavorful gata.' },
    ],
  },
  {
    key: 'platters',
    title: 'Platters',
    note: 'Great for sharing. Good for 4 to 5 persons.',
    src: ['22', '23', '24'],
    items: [
      { name: 'Filipino Spring Roll', price: 380, desc: 'Savory rolls wrapped to perfection, fried to golden crispiness.' },
      { name: 'Crispy Fried Chicken', price: 450, desc: 'Perfectly seasoned chicken, fried to golden perfection.' },
      { name: 'Sweet and Sour Chicken Fillet', price: 450, desc: 'Tender fried chicken in a bright, sweet and tangy glaze.' },
      { name: 'Classic Chicken and Pork Adobo', price: 450, desc: 'Rich, aromatic braised chicken and pork with traditional adobo flavors.' },
      { name: 'Kalabasa sa Gata', price: 390, desc: 'Tender squash simmered in rich coconut milk with sauteed aromatics, sweet and savory.' },
      { name: 'Chopsuey Overload', price: 700, desc: 'Crisp mixed vegetables stir fried with meats or seafood in a light savory sauce.' },
      { name: 'Red Curry Seafood Stew', price: 700, desc: 'Seafood simmered in Thai style red curry with coconut cream, fresh vegetables and herbs.' },
      { name: 'Paksiw na Lechon Kawali', price: 485, desc: 'Twice cooked crispy pork belly braised in a slow reduced paksiw sauce with liver pate.' },
      { name: 'Pork Menudo', price: 450, desc: 'Classic pork stew in rich tomato sauce with potatoes, carrots, bell peppers and raisins.' },
      { name: 'Classic Beef Kare Kare', price: 600, desc: 'Slow braised beef shank in a velvety peanut sauce with market vegetables and house made bagoong.' },
      { name: 'Beef Caldereta', price: 550 },
    ],
  },
  {
    key: 'rice-meals',
    title: 'Rice Meals',
    note: 'Solo feast plates. Dine in or order via GrabFood and Foodpanda.',
    src: ['86', '100', '101', '102', '103', '152', '153'],
    items: [
      { name: 'Braised Pork Ribs' },
      { name: 'Chicken Teriyaki' },
      { name: 'Shrimp Omo Rice' },
      { name: 'Salted Egg Shrimp' },
      { name: 'Spanish Style Bangus' },
      { name: 'Beef Curry Stew' },
      { name: 'Filipino Beef Steak' },
      { name: 'Pares Retiro Special' },
      { name: 'Bangus a la Pobre' },
      { name: 'Liempo Casserole' },
      { name: 'Chili Garlic Tuna Panga' },
      { name: 'Grilled Liempo', desc: 'With a sunny side up egg, garlic rice, fresh vegetables and a bowl of clear soup.' },
      { name: 'Homemade Beef Tapa', desc: 'With garlic rice and egg.' },
    ],
  },
  {
    key: 'pasta',
    title: 'Pasta',
    note: 'Best pasta in town. We deliver.',
    src: ['35', '110', '148', '131'],
    items: [
      { name: 'Shrimp Aglio Olio', price: 260 },
      { name: 'Spaghetti Meatballs', price: 255 },
      { name: 'Creamy Bacon and Mushroom', price: 250 },
      { name: 'Classic Carbonara', price: 230 },
      { name: 'Pasta Negra', desc: 'Squid ink sauce, Parmesan and chili flakes.' },
      { name: 'Seafood Pasta' },
    ],
  },
  {
    key: 'pansit-bilao',
    title: 'Pansit Bilao',
    note: 'Party trays in small, medium, large and extra large. Perfect for sharing.',
    sizes: ['S', 'M', 'L', 'XL'],
    src: ['32', '34', '33'],
    items: [
      { name: 'Sotanghon', sizes: { S: 550, M: 750, L: 950, XL: 1050 } },
      { name: 'Bihon', sizes: { S: 500, M: 700, L: 900, XL: 1000 } },
      { name: 'Canton Bihon', sizes: { S: 550, M: 750, L: 950, XL: 1050 } },
      { name: 'Sotanghon Bihon', sizes: { S: 600, M: 800, L: 950, XL: 1100 } },
      { name: 'Canton Chorizo', sizes: { S: 700, M: 900, L: 1000, XL: 1200 } },
      { name: 'Chami con Lechon', sizes: { S: 550, M: 750, L: 950, XL: 1050 } },
      { name: 'Miki Guisado', sizes: { S: 500, M: 700, L: 800, XL: 1000 } },
      { name: 'Seafood Palabok', sizes: { S: 850, M: 1050, L: 1200, XL: 1350 } },
      { name: 'Spaghetti with Meatballs', sizes: { S: 850, M: 1050, L: 1200, XL: 1350 } },
      { name: 'Carbonara', sizes: { S: 850, M: 1050, L: 1200, XL: 1350 } },
    ],
  },
  {
    key: 'appetizers',
    title: 'Appetizers',
    note: 'Photos are for reference. Plating may vary with the chef.',
    src: ['109', '147'],
    items: [
      { name: 'Japanese Maki', price: 350 },
      { name: 'California Salmon Roll', price: 350 },
      { name: 'Japanese Tempura Maki' },
    ],
  },
  {
    key: 'snacks',
    title: 'Snacks',
    src: ['88', '99', '151', '150', '98'],
    items: [
      { name: "Stefanie's Burger and Fries", price: 250 },
      { name: 'Mozzarella Sticks' },
      { name: 'Loaded Nachos' },
      { name: 'Loaded Fries' },
      { name: 'Crab Rangoons' },
      { name: 'Potato Chips' },
      { name: 'Eggs Benedict' },
      { name: 'Clubhouse Sandwich' },
    ],
  },
  {
    key: 'soup',
    title: 'Soup',
    src: ['93', '142'],
    items: [
      { name: 'Beef Bulalo' },
      { name: 'Red Sinigang Shrimp' },
      { name: 'Seafood Hototay' },
    ],
  },
  {
    key: 'healthy',
    title: 'Healthy Salads',
    note: 'Delicious and fresh. Online order via GrabFood and Foodpanda.',
    src: ['92'],
    items: [
      { name: 'Chicken Caesar Salad' },
      { name: 'Kani Peach Mango Salad' },
    ],
  },
  {
    key: 'veggie',
    title: 'Veggie Specials',
    src: ['97'],
    items: [
      { name: 'Mushroom Tofu' },
      { name: 'Tofu Ampalaya' },
      { name: 'Ensaladang Talong' },
    ],
  },
  {
    key: 'desserts',
    title: 'Desserts',
    src: ['17', '18'],
    items: [{ name: 'Tiramisu' }, { name: 'Panna Cotta' }],
  },
  {
    key: 'coffee',
    title: 'Coffee Series',
    note: 'Hot and iced.',
    columns: ['hot', 'iced'],
    src: ['106', '85', '96'],
    items: [
      { name: 'White Mocha', hot: 138, iced: 148 },
      { name: 'Spanish Latte', hot: 138, iced: 148 },
      { name: 'Caramel Macchiato', hot: 138, iced: 148 },
      { name: 'Dark Mocha', hot: 138, iced: 148 },
      { name: 'Amerikano', hot: 118, iced: 128 },
      { name: 'Cafe Latte', hot: 128 },
      { name: 'Iced Latte', iced: 138 },
      { name: "Stefanie's Sea Salt Caramel Latte", price: 158, isNew: true, desc: 'New to the menu.' },
    ],
  },
  {
    key: 'milk',
    title: 'Milk Series',
    note: 'Non coffee, hot and iced.',
    columns: ['hot', 'iced'],
    src: ['107'],
    items: [
      { name: 'Choco', hot: 138, iced: 148 },
      { name: 'Salted Caramel', hot: 138, iced: 148 },
      { name: 'Matcha Latte', hot: 138, iced: 148 },
      { name: 'Strawberry', iced: 158 },
    ],
  },
  {
    key: 'specials',
    title: "Stefanie's Specials",
    note: 'Layered house drinks.',
    src: ['107', '84', '25', '19'],
    items: [
      { name: 'Chocolate Matcha', price: 160 },
      { name: 'Oreo Matcha Taro', price: 165 },
      { name: 'Oreo Taro', price: 160 },
      { name: 'Strawberry Taro', price: 170 },
      { name: 'Strawberry Matcha', price: 165 },
    ],
  },
  {
    key: 'soda',
    title: 'Soda Series',
    src: ['108'],
    items: [
      { name: 'Lychee', price: 120 },
      { name: 'Strawberry', price: 120 },
      { name: 'Kiwi', price: 120 },
      { name: 'Green Apple', price: 120 },
      { name: 'Blueberry', price: 120 },
    ],
  },
  {
    key: 'yakult',
    title: 'Yakult Series',
    src: ['108', '146'],
    items: [
      { name: 'Strawberry', price: 125 },
      { name: 'Blue Lemonade', price: 125 },
      { name: 'Green Apple', price: 125 },
      { name: 'Blueberry', price: 125 },
    ],
  },
  {
    key: 'cocktails',
    title: 'Cocktails',
    note: 'Happy Hour 4 PM to 8 PM. Buy 1, get the 2nd at 50% off on selected cocktails.',
    src: ['111', '123', '127', '144', '11'],
    items: [
      { name: 'Long Island Iced Tea', desc: 'A bold blend with a refreshing finish.' },
      { name: 'Mai Tai' },
      { name: 'Whisky Sour' },
      { name: "The Devil's Whisper", desc: 'House chili cocktail by RAB.' },
    ],
  },
  {
    key: 'beer',
    title: 'Beer',
    note: 'Grab a bucket of cold beer and pick one free pulutan.',
    src: ['134', '135', '136'],
    items: [
      { name: 'Beer Bucket', desc: 'Free pulutan of your choice: Exotic Land Snail, Sizzling Sisig, Chicharong Bulaklak, Sizzling Hotdog or Fries.' },
    ],
  },
  {
    key: 'unli-wings',
    title: 'Unli Wings',
    note: 'Served Tuesday to Sunday, 2 PM to 7 PM only.',
    src: ['128', '141', '143', '129', '130'],
    items: [
      { name: 'Regular Unli', price: 359, desc: 'Unli chicken wings, drinks, fries, rice and soup.' },
    ],
  },
];

// Current promos, transcribed from the offer posters.
export const offers = [
  { key: 'unli-wings', title: 'Unli Wings. Unli Fun.', price: 359, detail: 'Unlimited chicken wings, fries, rice, drinks and soup. Tuesday to Sunday, 2 PM to 7 PM only.', imageIds: ['128', '141', '143', '129', '130'] },
  { key: 'unli-rice', title: 'Unlimited Rice and Drinks', price: 499, detail: 'Pork BBQ, fried chicken, pansit bihon, chicharon bulaklak, lumpiang shanghai, potato hashbrown, dumplings and atsara, with unli rice and drinks.', imageIds: ['30', '31'] },
  { key: 'happy-hour', title: 'Happy Hour', detail: 'Buy 1 cocktail, get the 2nd at 50% off on selected cocktails. 4 PM to 8 PM.', imageIds: ['123', '111'] },
  { key: 'beer-bucket', title: 'Grab a Bucket. Pick Your Pulutan.', detail: 'A bucket of cold beer with one free pulutan: Exotic Land Snail, Sizzling Sisig, Chicharong Bulaklak, Sizzling Hotdog or Fries.', imageIds: ['134'] },
  { key: 'burger-fries', title: "Stefanie's Burger and Fries", price: 250, detail: 'Available for delivery.', imageIds: ['98'] },
  { key: 'combo', title: 'Your New Favorite Combo', detail: 'Burger with fries and strawberry soda.', imageIds: ['90'] },
  { key: 'bilao', title: 'Pansit Bilao Promo', detail: 'Order at least 2 large bilao and get free softdrinks, or order 2 bilao or 2 food trays and get 1 free tray of lumpia or mango jelly. Free delivery along Balagtas, Batangas City. Limited time only.', imageIds: ['34', '32'] },
  { key: 'main-course', title: 'Main Course', detail: 'Delivery, pick up or dine in.', imageIds: ['68'] },
  { key: 'specials-30', title: "Stefanie's Specials 30% Off", detail: 'Grab your strawberry matcha before work.', imageIds: ['19'] },
];

export const comingSoon = [
  { name: 'Spaghetti Meatballs', tagline: 'Simple. Saucy. Satisfying.', imageId: '12' },
  { name: 'Braised Bliss Ribs', tagline: 'Fall off the bone perfection, slow braised to pure bliss.', imageId: '13' },
];

// Event packages (posters 112, 113, 114). All are exclusive for 5 hours, served buffet style.
const PACKAGE_INCLUSIONS = [
  'Basic party set up',
  'Free use of TV monitor and basic sound system',
  'Fully airconditioned venue and event crew',
];

export const packages = [
  {
    key: 'pax-20',
    price: 12800,
    pax: 20,
    hours: 5,
    imageId: '112',
    inclusions: PACKAGE_INCLUSIONS,
    sets: {
      A: ['Flavored Wings', 'Chicken Sotanghon Guisado', 'Crispy Kare Kare', 'Sweet and Sour Fish Fillet', 'Lumpiang Shanghai', 'Rice good for 20 pax', 'Unli pitcher of Lemonade or Iced Tea', 'Choice of Mango Tapioca or Cake'],
      B: ['Cordon Bleu Bites', 'Canton Guisado', 'Beef Steak', 'Lumpiang Hanoi', 'Igado', 'Rice good for 20 pax', 'Unli pitcher of Lemonade or Iced Tea', 'Choice of Mango Jelly or Cake'],
    },
  },
  {
    key: 'pax-30',
    price: 15500,
    pax: 30,
    hours: 5,
    imageId: '113',
    inclusions: PACKAGE_INCLUSIONS,
    sets: {
      A: ['Canton Guisado', '2 pcs Relyenong Bangus', '2 pcs Crispy Pata', 'Beef Caldereta or Beef Curry Stew', 'Chopsuey Special', '35 pcs Spring Rolls', 'Rice good for 30 pax', 'Unli pitcher of Lemonade or Iced Tea', 'Tray of Buko Pandan'],
      B: ['Canton Sotanghon', 'Sweet and Sour Pork', 'Spicy Salted Egg Shrimp and Mussel', 'Stir Fry Mongolian Beef', '12 pcs Chicken ala Max', '35 pcs Pork and Shrimp Lumpia', 'Rice good for 30 pax', 'Unli pitcher of Lemonade or Iced Tea', 'Tray of Coffee Jelly'],
    },
  },
  {
    key: 'pax-40',
    price: 19000,
    pax: 40,
    hours: 5,
    imageId: '114',
    inclusions: PACKAGE_INCLUSIONS,
    sets: {
      A: ['Palabok', '45 pcs Pork and Shrimp Lumpia', 'Chicken Teriyaki', 'Garlic Pepper Beef', 'Braised Pork Ribs', 'Seafood Egg', '80 pcs Shrimp Tempura', 'Rice good for 40 pax', 'Unli pitcher of Lemonade or Iced Tea', 'Buko Salad or Tiramisu'],
      B: ['Chicken Sotanghon', '4 pcs Crispy Pata', 'Roast Beef', 'Pork Mechado', 'Buttered Shrimp', '45 pcs Lumpia', '40 pcs Flavored Wings', 'Rice good for 40 pax', 'Unli pitcher of Lemonade or Iced Tea', '40 cups of Jelly'],
    },
  },
];

export const formatPeso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;
