const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://mongo:27017/food_delivery_restaurants';
  let attempt = 0;
  while (true) {
    try {
      attempt += 1;
      await mongoose.connect(uri);
      console.log(`[restaurant-service] MongoDB connected: ${uri}`);
      return;
    } catch (err) {
      console.error(`[restaurant-service] Mongo connect attempt ${attempt} failed: ${err.message}. Retrying in 5s...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

module.exports = connectDB;
