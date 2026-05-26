const axios = require('axios');
const Delivery = require('../models/Delivery');

const activeTimers = new Map();

function clampStep(current, target) {
  const diff = target - current;
  if (Math.abs(diff) < 0.0005) return target;
  const step = 0.0005 + Math.random() * 0.0002;
  return current + Math.sign(diff) * Math.min(step, Math.abs(diff));
}

async function emitToOrderService({ orderId, lat, lng, driverId }) {
  const url = `${process.env.ORDER_SERVICE_URL || 'http://order-service:3003'}/internal/emit-location`;
  try {
    await axios.post(url, { orderId, lat, lng, driverId }, { timeout: 4000 });
  } catch (e) {
    // Service may not yet be reachable; log and continue.
    console.error('[driver-sim] emit failed:', e.message);
  }
}

function startSimulation(deliveryId) {
  if (activeTimers.has(deliveryId.toString())) return;

  const timer = setInterval(async () => {
    try {
      const delivery = await Delivery.findById(deliveryId);
      if (!delivery) {
        stopSimulation(deliveryId);
        return;
      }
      if (delivery.status === 'DELIVERED') {
        stopSimulation(deliveryId);
        return;
      }

      const dest = delivery.destinationLocation || { lat: 28.6139, lng: 77.209 };
      const newLat = clampStep(delivery.currentLocation.lat, dest.lat);
      const newLng = clampStep(delivery.currentLocation.lng, dest.lng);

      delivery.currentLocation.lat = newLat;
      delivery.currentLocation.lng = newLng;

      const reached =
        Math.abs(newLat - dest.lat) < 0.0006 && Math.abs(newLng - dest.lng) < 0.0006;
      if (reached) {
        delivery.status = 'DELIVERED';
      } else if (delivery.status === 'ASSIGNED') {
        delivery.status = 'EN_ROUTE';
      }
      await delivery.save();

      await emitToOrderService({
        orderId: delivery.orderId.toString(),
        lat: newLat,
        lng: newLng,
        driverId: delivery.driverId,
      });

      if (delivery.status === 'DELIVERED') stopSimulation(deliveryId);
    } catch (e) {
      console.error('[driver-sim tick]', e.message);
    }
  }, 3000);

  if (typeof timer.unref === 'function') timer.unref();
  activeTimers.set(deliveryId.toString(), timer);
}

function stopSimulation(deliveryId) {
  const key = deliveryId.toString();
  const t = activeTimers.get(key);
  if (t) {
    clearInterval(t);
    activeTimers.delete(key);
  }
}

function stopAll() {
  for (const [, t] of activeTimers) clearInterval(t);
  activeTimers.clear();
}

module.exports = { startSimulation, stopSimulation, stopAll };
