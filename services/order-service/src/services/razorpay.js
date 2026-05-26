const Razorpay = require('razorpay');

function buildClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('placeholder') || key_secret.includes('placeholder')) {
    return null;
  }
  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.error('[razorpay] Failed to init client:', err.message);
    return null;
  }
}

const client = buildClient();

function isLive() {
  return !!client;
}

async function createRazorpayOrder({ amount, currency = 'INR', receipt }) {
  if (!client) {
    return {
      id: `rzp_dev_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: 'created',
      _mock: true,
    };
  }
  return client.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  });
}

module.exports = { createRazorpayOrder, isLive };
