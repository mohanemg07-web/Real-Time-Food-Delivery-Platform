require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';

const data = [
  {
    restaurant: {
      name: 'Spice Garden',
      cuisine: ['Indian', 'North Indian'],
      description: 'Authentic North Indian cuisine with fragrant spices and tandoor specialties.',
      address: { street: '12 MG Road', city: 'Delhi', coordinates: { lat: 28.6315, lng: 77.2167 } },
      rating: 4.6,
      deliveryTime: '30-40 mins',
      minimumOrder: 199,
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80',
    },
    menu: [
      { name: 'Samosa (2 pcs)', description: 'Crispy pastry stuffed with spiced potatoes and peas.', price: 60, category: 'Starter', isVeg: true, rating: 4.5 },
      { name: 'Butter Chicken', description: 'Tender chicken in a creamy tomato-butter gravy.', price: 320, category: 'Main', isVeg: false, rating: 4.8 },
      { name: 'Chicken Biryani', description: 'Fragrant basmati rice cooked with chicken and aromatic spices.', price: 280, category: 'Main', isVeg: false, rating: 4.7 },
      { name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich tomato cream.', price: 220, category: 'Main', isVeg: true, rating: 4.6 },
      { name: 'Garlic Naan', description: 'Soft Indian bread topped with garlic and butter.', price: 60, category: 'Bread', isVeg: true, rating: 4.4 },
      { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled in the tandoor.', price: 260, category: 'Starter', isVeg: true, rating: 4.5 },
      { name: 'Gulab Jamun (2 pcs)', description: 'Soft milk dumplings soaked in cardamom syrup.', price: 80, category: 'Dessert', isVeg: true, rating: 4.7 },
      { name: 'Sweet Lassi', description: 'Chilled yogurt drink with sugar and cardamom.', price: 90, category: 'Beverage', isVeg: true, rating: 4.3 },
      { name: 'Boondi Raita', description: 'Cooling yogurt with crispy chickpea pearls.', price: 70, category: 'Side', isVeg: true, rating: 4.2 },
      { name: 'Veg Pulao', description: 'Basmati rice tossed with mixed vegetables and whole spices.', price: 180, category: 'Main', isVeg: true, rating: 4.4 },
    ],
  },
  {
    restaurant: {
      name: 'Dragon Wok',
      cuisine: ['Chinese', 'Asian'],
      description: 'Sizzling wok-tossed Chinese favourites and dim sum.',
      address: { street: '45 Connaught Place', city: 'Delhi', coordinates: { lat: 28.6328, lng: 77.2197 } },
      rating: 4.4,
      deliveryTime: '25-35 mins',
      minimumOrder: 249,
      image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80',
    },
    menu: [
      { name: 'Veg Spring Rolls', description: 'Crispy rolls filled with shredded vegetables.', price: 180, category: 'Starter', isVeg: true, rating: 4.4 },
      { name: 'Chicken Fried Rice', description: 'Wok-tossed rice with chicken, egg and spring onions.', price: 240, category: 'Main', isVeg: false, rating: 4.5 },
      { name: 'Veg Manchurian (Dry)', description: 'Crispy vegetable balls in spicy soy garlic sauce.', price: 220, category: 'Main', isVeg: true, rating: 4.6 },
      { name: 'Chicken Chow Mein', description: 'Stir-fried noodles with chicken and crunchy vegetables.', price: 260, category: 'Main', isVeg: false, rating: 4.5 },
      { name: 'Steamed Veg Dim Sum (6 pcs)', description: 'Delicate dumplings stuffed with mixed vegetables.', price: 280, category: 'Starter', isVeg: true, rating: 4.7 },
      { name: 'Kung Pao Chicken', description: 'Diced chicken with peanuts and dry chillies.', price: 310, category: 'Main', isVeg: false, rating: 4.6 },
      { name: 'Hot & Sour Soup', description: 'Tangy soup with mushrooms, tofu and bamboo shoots.', price: 150, category: 'Soup', isVeg: true, rating: 4.3 },
      { name: 'Veg Hakka Noodles', description: 'Stir-fried noodles with crunchy vegetables.', price: 210, category: 'Main', isVeg: true, rating: 4.4 },
      { name: 'Sweet Corn Soup', description: 'Creamy corn soup with mild seasoning.', price: 140, category: 'Soup', isVeg: true, rating: 4.2 },
      { name: 'Fortune Cookies (3 pcs)', description: 'Crisp cookies with a fortune inside.', price: 90, category: 'Dessert', isVeg: true, rating: 4.0 },
    ],
  },
  {
    restaurant: {
      name: 'Pizza Palazzo',
      cuisine: ['Italian', 'Pizza'],
      description: 'Wood-fired pizzas, hand-rolled pasta and creamy desserts.',
      address: { street: '7 Khan Market', city: 'Delhi', coordinates: { lat: 28.5994, lng: 77.2272 } },
      rating: 4.5,
      deliveryTime: '35-45 mins',
      minimumOrder: 299,
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    },
    menu: [
      { name: 'Margherita Pizza', description: 'Classic tomato, mozzarella and fresh basil.', price: 320, category: 'Pizza', isVeg: true, rating: 4.7 },
      { name: 'Pepperoni Pizza', description: 'Spicy pepperoni on a bed of melted mozzarella.', price: 420, category: 'Pizza', isVeg: false, rating: 4.8 },
      { name: 'Farmhouse Pizza', description: 'Loaded with onion, capsicum, tomato and mushroom.', price: 380, category: 'Pizza', isVeg: true, rating: 4.5 },
      { name: 'Spaghetti Alfredo', description: 'Creamy parmesan sauce with cracked pepper.', price: 340, category: 'Pasta', isVeg: true, rating: 4.6 },
      { name: 'Penne Arrabbiata', description: 'Penne in spicy tomato and garlic sauce.', price: 320, category: 'Pasta', isVeg: true, rating: 4.4 },
      { name: 'Garlic Bread Sticks', description: 'Buttery, garlicky breadsticks with herbs.', price: 160, category: 'Starter', isVeg: true, rating: 4.5 },
      { name: 'Caesar Salad', description: 'Crisp romaine, croutons and parmesan in Caesar dressing.', price: 240, category: 'Salad', isVeg: true, rating: 4.3 },
      { name: 'Tiramisu', description: 'Coffee-soaked ladyfingers with mascarpone cream.', price: 220, category: 'Dessert', isVeg: true, rating: 4.8 },
      { name: 'Choco Lava Cake', description: 'Molten chocolate centre with vanilla ice cream.', price: 180, category: 'Dessert', isVeg: true, rating: 4.7 },
      { name: 'Iced Lemon Tea', description: 'Refreshing iced tea with a hint of lemon.', price: 120, category: 'Beverage', isVeg: true, rating: 4.1 },
    ],
  },
  {
    restaurant: {
      name: 'Burger Barn',
      cuisine: ['American', 'Burgers'],
      description: 'Juicy burgers, loaded fries and thick shakes.',
      address: { street: '22 Hauz Khas Village', city: 'Delhi', coordinates: { lat: 28.5535, lng: 77.1944 } },
      rating: 4.3,
      deliveryTime: '20-30 mins',
      minimumOrder: 199,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    },
    menu: [
      { name: 'Classic Cheeseburger', description: 'Beef patty, cheddar, lettuce and house sauce.', price: 260, category: 'Burger', isVeg: false, rating: 4.6 },
      { name: 'Veggie Crunch Burger', description: 'Crispy veg patty with smoky mayo and slaw.', price: 220, category: 'Burger', isVeg: true, rating: 4.4 },
      { name: 'Double Bacon Burger', description: 'Double patty with crispy bacon and BBQ sauce.', price: 360, category: 'Burger', isVeg: false, rating: 4.8 },
      { name: 'Crispy Chicken Burger', description: 'Buttermilk-fried chicken with spicy mayo.', price: 280, category: 'Burger', isVeg: false, rating: 4.7 },
      { name: 'Loaded Fries', description: 'Fries topped with cheese sauce and jalapeños.', price: 220, category: 'Side', isVeg: true, rating: 4.5 },
      { name: 'Onion Rings', description: 'Crisp-battered onion rings with dip.', price: 160, category: 'Side', isVeg: true, rating: 4.2 },
      { name: 'Chicken Wings (6 pcs)', description: 'Smoky BBQ-glazed chicken wings.', price: 320, category: 'Starter', isVeg: false, rating: 4.6 },
      { name: 'Vanilla Milkshake', description: 'Thick milkshake with vanilla ice cream.', price: 180, category: 'Beverage', isVeg: true, rating: 4.3 },
      { name: 'Chocolate Brownie Sundae', description: 'Warm brownie with ice cream and chocolate sauce.', price: 220, category: 'Dessert', isVeg: true, rating: 4.7 },
      { name: 'Cola (500ml)', description: 'Chilled cola.', price: 80, category: 'Beverage', isVeg: true, rating: 4.0 },
    ],
  },
  {
    restaurant: {
      name: 'Sushi Sakura',
      cuisine: ['Japanese', 'Sushi'],
      description: 'Hand-crafted sushi, ramen and Japanese small plates.',
      address: { street: '18 Greater Kailash', city: 'Delhi', coordinates: { lat: 28.5495, lng: 77.2425 } },
      rating: 4.7,
      deliveryTime: '35-50 mins',
      minimumOrder: 399,
      image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80',
    },
    menu: [
      { name: 'California Roll (8 pcs)', description: 'Crab stick, avocado and cucumber roll.', price: 420, category: 'Sushi', isVeg: false, rating: 4.7 },
      { name: 'Veg Avocado Roll (8 pcs)', description: 'Avocado, cucumber and pickled radish.', price: 360, category: 'Sushi', isVeg: true, rating: 4.5 },
      { name: 'Salmon Nigiri (4 pcs)', description: 'Slices of fresh salmon over seasoned rice.', price: 480, category: 'Sushi', isVeg: false, rating: 4.9 },
      { name: 'Tuna Sashimi (5 pcs)', description: 'Sliced raw tuna served with wasabi and soy.', price: 520, category: 'Sashimi', isVeg: false, rating: 4.8 },
      { name: 'Chicken Ramen', description: 'Rich chicken broth with noodles, egg and scallions.', price: 380, category: 'Ramen', isVeg: false, rating: 4.6 },
      { name: 'Veg Tempura', description: 'Crispy battered seasonal vegetables.', price: 280, category: 'Starter', isVeg: true, rating: 4.4 },
      { name: 'Miso Soup', description: 'Traditional soybean paste soup with tofu.', price: 140, category: 'Soup', isVeg: true, rating: 4.3 },
      { name: 'Edamame', description: 'Steamed soybeans with sea salt.', price: 180, category: 'Starter', isVeg: true, rating: 4.2 },
      { name: 'Teriyaki Chicken Bowl', description: 'Grilled chicken in teriyaki glaze over rice.', price: 360, category: 'Main', isVeg: false, rating: 4.7 },
      { name: 'Mochi Ice Cream (3 pcs)', description: 'Soft rice cake filled with ice cream.', price: 240, category: 'Dessert', isVeg: true, rating: 4.6 },
    ],
  },
];

async function seed() {
  for (const { restaurant, menu } of data) {
    const created = await Restaurant.create({ ...restaurant, image: restaurant.image || PLACEHOLDER_IMG });
    const items = menu.map((m) => ({ ...m, restaurantId: created._id, image: m.image || PLACEHOLDER_IMG }));
    await MenuItem.insertMany(items);
    console.log(`[seeder] Seeded ${created.name} with ${items.length} items`);
  }
}

async function runIfEmpty() {
  const count = await Restaurant.countDocuments();
  if (count > 0) {
    console.log(`[seeder] Skipping — ${count} restaurants already present`);
    return;
  }
  await seed();
}

module.exports = { seed, runIfEmpty };

if (require.main === module) {
  (async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/food_delivery_restaurants';
    await mongoose.connect(uri);
    await seed();
    await mongoose.disconnect();
    process.exit(0);
  })().catch((e) => {
    console.error('[seeder] Failed:', e);
    process.exit(1);
  });
}
