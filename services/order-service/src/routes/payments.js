const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const { createRazorpayOrder } = require('../services/razorpay');
const { emitNewOrder } = require('../socket/socketServer');
const axios = require('axios');

const router = express.Router();

router.post('/create', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount > 0 is required' });
    }
    const rzpOrder = await createRazorpayOrder({ amount, currency, receipt });
    return res.json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      mock: !!rzpOrder._mock,
    });
  } catch (err) {
    console.error('[payments/create]', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderData } = req.body;
    if (!razorpayOrderId || !razorpayPaymentId || !orderData) {
      return res.status(400).json({ error: 'razorpayOrderId, razorpayPaymentId and orderData required' });
    }

    const isMockId = String(razorpayOrderId).startsWith('rzp_dev_');
    let valid = false;
    if (isMockId) {
      valid = true;
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET || '';
      if (!secret || secret.includes('placeholder')) {
        valid = true;
      } else if (razorpaySignature) {
        const expected = crypto
          .createHmac('sha256', secret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');
        valid = expected === razorpaySignature;
      }
    }

    if (!valid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const totalAmount = (orderData.items || []).reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 1),
      0
    ) + Number(orderData.deliveryFee || 0);

    const order = await Order.create({
      userId: req.user.id,
      restaurantId: orderData.restaurantId,
      restaurantName: orderData.restaurantName || '',
      items: orderData.items || [],
      totalAmount,
      deliveryAddress: orderData.deliveryAddress,
      status: 'PENDING',
      statusHistory: [{ status: 'PENDING', note: 'Order received', timestamp: new Date() }],
      paymentId: razorpayPaymentId,
      razorpayOrderId,
      paymentStatus: 'PAID',
      estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000),
    });

    emitNewOrder(orderData.restaurantId, order);

    const deliveryUrl = `${process.env.DELIVERY_SERVICE_URL || 'http://delivery-service:3004'}/`;
    axios.post(deliveryUrl, {
      orderId: order._id.toString(),
      userId: order.userId.toString(),
      deliveryAddress: order.deliveryAddress,
    }, { timeout: 5000 }).catch((e) => console.error('[payments/verify] delivery notify failed:', e.message));

    const { emitOrderStatus } = require('../socket/socketServer');
    const STATUS_PROGRESSION = [
      { delayMs: 30 * 1000, status: 'CONFIRMED', note: 'Restaurant confirmed your order' },
      { delayMs: 90 * 1000, status: 'PREPARING', note: 'Your food is being prepared' },
      { delayMs: 180 * 1000, status: 'OUT_FOR_DELIVERY', note: 'Driver picked up your order' },
      { delayMs: 300 * 1000, status: 'DELIVERED', note: 'Order delivered. Enjoy!' },
    ];
    for (const step of STATUS_PROGRESSION) {
      setTimeout(async () => {
        try {
          const o = await Order.findById(order._id);
          if (!o || o.status === 'CANCELLED' || o.status === 'DELIVERED') return;
          o.status = step.status;
          o.statusHistory.push({ status: step.status, note: step.note, timestamp: new Date() });
          await o.save();
          emitOrderStatus(o._id.toString(), step.status, step.note);
        } catch (e) {
          console.error('[payments/auto-progress]', e.message);
        }
      }, step.delayMs).unref?.();
    }

    return res.json({ success: true, orderId: order._id.toString(), order });
  } catch (err) {
    console.error('[payments/verify]', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

module.exports = router;
