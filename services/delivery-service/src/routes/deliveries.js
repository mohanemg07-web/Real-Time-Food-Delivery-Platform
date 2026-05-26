const express = require('express');
const mongoose = require('mongoose');
const Delivery = require('../models/Delivery');
const { startSimulation } = require('../simulation/driverSimulator');

const router = express.Router();

function jitter(lat, lng, range = 0.012) {
  const delta = () => (Math.random() - 0.5) * range;
  return { lat: lat + delta(), lng: lng + delta() };
}

router.post('/', async (req, res) => {
  try {
    const { orderId, userId, deliveryAddress } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });

    const existing = await Delivery.findOne({ orderId });
    if (existing) return res.json({ delivery: existing, created: false });

    const destLat = deliveryAddress?.coordinates?.lat || 28.6139;
    const destLng = deliveryAddress?.coordinates?.lng || 77.209;
    const start = jitter(destLat, destLng, 0.02);

    const delivery = await Delivery.create({
      orderId,
      userId: userId || undefined,
      currentLocation: { lat: start.lat, lng: start.lng },
      destinationLocation: { lat: destLat, lng: destLng },
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000),
      status: 'ASSIGNED',
    });

    startSimulation(delivery._id);

    return res.status(201).json({ delivery, created: true });
  } catch (err) {
    console.error('[deliveries/create]', err);
    return res.status(500).json({ error: 'Failed to create delivery' });
  }
});

router.get('/:orderId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }
    const delivery = await Delivery.findOne({ orderId: req.params.orderId });
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    return res.json({ delivery });
  } catch (err) {
    console.error('[deliveries/get]', err);
    return res.status(500).json({ error: 'Failed to fetch delivery' });
  }
});

router.put('/:id/location', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid delivery id' });
    }
    const { lat, lng } = req.body;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng numbers required' });
    }
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { $set: { 'currentLocation.lat': lat, 'currentLocation.lng': lng } },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
    return res.json({ delivery });
  } catch (err) {
    console.error('[deliveries/location]', err);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

module.exports = router;
