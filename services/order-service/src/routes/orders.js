const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { emitOrderStatus, emitNewOrder, emitDeliveryLocation } = require('../socket/socketServer');

const router = express.Router();

const STATUS_PROGRESSION = [
  { delayMs: 30 * 1000, status: 'CONFIRMED', note: 'Restaurant confirmed your order' },
  { delayMs: 90 * 1000, status: 'PREPARING', note: 'Your food is being prepared' },
  { delayMs: 180 * 1000, status: 'OUT_FOR_DELIVERY', note: 'Driver picked up your order' },
  { delayMs: 300 * 1000, status: 'DELIVERED', note: 'Order delivered. Enjoy!' },
];

function scheduleAutoProgress(orderId) {
  for (const step of STATUS_PROGRESSION) {
    setTimeout(async () => {
      try {
        const order = await Order.findById(orderId);
        if (!order || order.status === 'CANCELLED' || order.status === 'DELIVERED') return;
        order.status = step.status;
        order.statusHistory.push({ status: step.status, note: step.note, timestamp: new Date() });
        await order.save();
        emitOrderStatus(orderId, step.status, step.note);
      } catch (e) {
        console.error('[orders/auto-progress]', e.message);
      }
    }, step.delayMs).unref?.();
  }
}

async function notifyDeliveryService(order) {
  const url = `${process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004'}/`;
  try {
    await axios.post(url, {
      orderId: order._id.toString(),
      userId: order.userId.toString(),
      deliveryAddress: order.deliveryAddress,
    }, { timeout: 5000 });
  } catch (e) {
    console.error('[orders] delivery-service notify failed:', e.message);
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const { restaurantId, restaurantName, items, deliveryAddress, paymentId, razorpayOrderId } = req.body;
    if (!restaurantId || !Array.isArray(items) || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({ error: 'restaurantId, items[] and deliveryAddress are required' });
    }

    const totalAmount = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
    const eta = new Date(Date.now() + 35 * 60 * 1000);

    const order = await Order.create({
      userId: req.user.id,
      restaurantId,
      restaurantName: restaurantName || '',
      items,
      totalAmount,
      deliveryAddress,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', note: 'Order received', timestamp: new Date() }],
      paymentId: paymentId || '',
      razorpayOrderId: razorpayOrderId || '',
      paymentStatus: paymentId ? 'PAID' : 'PENDING',
      estimatedDeliveryTime: eta,
    });

    emitNewOrder(restaurantId, order);
    notifyDeliveryService(order);
    scheduleAutoProgress(order._id.toString());

    return res.status(201).json({ order });
  } catch (err) {
    console.error('[orders/create]', err);
    return res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    if (req.params.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    return res.json({ orders });
  } catch (err) {
    console.error('[orders/list-by-user]', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json({ order });
  } catch (err) {
    console.error('[orders/get]', err);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid order id' });
    }
    const { status, note } = req.body;
    const allowed = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.status = status;
    order.statusHistory.push({ status, note: note || '', timestamp: new Date() });
    await order.save();
    emitOrderStatus(order._id.toString(), status, note || '');
    return res.json({ order });
  } catch (err) {
    console.error('[orders/status]', err);
    return res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/internal/emit-location', async (req, res) => {
  try {
    const { orderId, lat, lng, driverId } = req.body;
    if (!orderId || typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'orderId, lat, lng required' });
    }
    emitDeliveryLocation(orderId, lat, lng, driverId || 'DRV-UNKNOWN');
    return res.json({ ok: true });
  } catch (err) {
    console.error('[orders/internal/emit-location]', err);
    return res.status(500).json({ error: 'Failed to emit' });
  }
});

module.exports = router;
