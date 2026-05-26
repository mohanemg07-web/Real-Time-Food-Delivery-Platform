const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  cuisine: [{ type: String }],
  description: { type: String, default: '' },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.209 },
    },
  },
  rating: { type: Number, default: 4.0, min: 1, max: 5 },
  deliveryTime: { type: String, default: '30-45 mins' },
  minimumOrder: { type: Number, default: 199 },
  isOpen: { type: Boolean, default: true },
  image: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);
