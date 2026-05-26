const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId },
  driverId: {
    type: String,
    default: () => `DRV-${Math.floor(Math.random() * 9000) + 1000}`,
  },
  driverName: { type: String, default: 'Rahul Kumar' },
  driverPhone: { type: String, default: '+91-98765-43210' },
  currentLocation: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.209 },
  },
  destinationLocation: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.209 },
  },
  status: {
    type: String,
    enum: ['ASSIGNED', 'PICKED_UP', 'EN_ROUTE', 'DELIVERED'],
    default: 'ASSIGNED',
  },
  estimatedArrival: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Delivery', DeliverySchema);
