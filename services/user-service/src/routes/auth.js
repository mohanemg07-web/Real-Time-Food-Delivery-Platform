const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = '7d';

function signToken(user) {
  const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
  return jwt.sign({ id: user._id.toString(), email: user.email }, secret, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 1 }).withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      const user = await User.create({ name, email, password: hashed });
      const token = signToken(user);

      return res.status(201).json({
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email },
      });
    } catch (err) {
      console.error('[auth/register]', err);
      return res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isString().isLength({ min: 1 }).withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      }

      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = signToken(user);
      return res.json({
        token,
        user: { id: user._id.toString(), name: user.name, email: user.email },
      });
    } catch (err) {
      console.error('[auth/login]', err);
      return res.status(500).json({ error: 'Failed to login' });
    }
  }
);

module.exports = router;
