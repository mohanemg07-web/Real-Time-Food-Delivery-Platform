const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Recommendation = require('../models/Recommendation');
const { generateRecommendations } = require('../services/openai');

const router = express.Router();

function fallbackTopRated(menuItems) {
  return [...menuItems]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)
    .map((m) => ({
      name: m.name,
      reason: 'Top-rated dish at this restaurant',
      price: m.price,
      category: m.category,
    }));
}

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const cached = await Recommendation.findOne({ userId });
    if (cached && cached.recommendations?.length > 0) {
      return res.json({ recommendations: cached.recommendations, cached: true });
    }

    let recentOrders = [];
    if (mongoose.Types.ObjectId.isValid(userId)) {
      recentOrders = await Order.find({ userId, status: 'DELIVERED' })
        .sort({ createdAt: -1 })
        .limit(10);
    }

    const itemCounts = {};
    for (const o of recentOrders) {
      for (const it of o.items || []) {
        itemCounts[it.name] = (itemCounts[it.name] || 0) + (it.quantity || 1);
      }
    }
    const orderHistory = Object.entries(itemCounts).map(([name, qty]) => ({ name, quantity: qty }));

    let targetRestaurantId = null;
    if (recentOrders[0]?.restaurantId) {
      targetRestaurantId = recentOrders[0].restaurantId.toString();
    } else {
      try {
        const list = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3002'}/`,
          { timeout: 5000 }
        );
        targetRestaurantId = list.data.restaurants?.[0]?._id;
      } catch (e) {
        console.error('[recommendations] failed to list restaurants:', e.message);
      }
    }

    let menuItems = [];
    if (targetRestaurantId) {
      try {
        const menuRes = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3002'}/${targetRestaurantId}/menu`,
          { timeout: 5000 }
        );
        menuItems = menuRes.data.items || [];
      } catch (e) {
        console.error('[recommendations] failed to fetch menu:', e.message);
      }
    }

    if (menuItems.length === 0) {
      return res.json({ recommendations: [], cached: false, reason: 'no_menu_available' });
    }

    let recommendations;
    try {
      recommendations = await generateRecommendations({ orderHistory, menuItems });
    } catch (e) {
      console.error('[recommendations] OpenAI failed, using fallback:', e.message);
      recommendations = fallbackTopRated(menuItems);
    }

    await Recommendation.findOneAndUpdate(
      { userId },
      { userId, recommendations, generatedAt: new Date() },
      { upsert: true, new: true }
    );

    return res.json({ recommendations, cached: false });
  } catch (err) {
    console.error('[recommendations/get]', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
