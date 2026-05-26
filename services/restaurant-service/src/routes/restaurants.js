const express = require('express');
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { cuisine, search } = req.query;
    const query = { isOpen: true };
    if (cuisine && cuisine !== 'All') {
      query.cuisine = { $in: [cuisine] };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    const restaurants = await Restaurant.find(query).sort({ rating: -1 });
    return res.json({ restaurants });
  } catch (err) {
    console.error('[restaurants/list]', err);
    return res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant id' });
    }
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    return res.json({ restaurant });
  } catch (err) {
    console.error('[restaurants/get]', err);
    return res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

router.get('/:id/menu', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant id' });
    }
    const items = await MenuItem.find({ restaurantId: req.params.id, isAvailable: true }).sort({ category: 1, rating: -1 });
    const grouped = items.reduce((acc, item) => {
      const cat = item.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
    return res.json({ menu: grouped, items });
  } catch (err) {
    console.error('[restaurants/menu]', err);
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.post('/', async (req, res) => {
  try {
    const restaurant = await Restaurant.create(req.body);
    return res.status(201).json({ restaurant });
  } catch (err) {
    console.error('[restaurants/create]', err);
    return res.status(400).json({ error: err.message || 'Failed to create restaurant' });
  }
});

router.put('/:id/menu', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant id' });
    }
    const payload = { ...req.body, restaurantId: req.params.id };
    let item;
    if (payload._id && mongoose.Types.ObjectId.isValid(payload._id)) {
      item = await MenuItem.findByIdAndUpdate(payload._id, payload, { new: true, upsert: true, setDefaultsOnInsert: true });
    } else {
      item = await MenuItem.create(payload);
    }
    return res.json({ item });
  } catch (err) {
    console.error('[restaurants/menu/upsert]', err);
    return res.status(400).json({ error: err.message || 'Failed to upsert menu item' });
  }
});

module.exports = router;
