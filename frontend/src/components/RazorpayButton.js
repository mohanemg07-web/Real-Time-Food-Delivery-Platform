'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { orderApi } from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({ amount, orderData, disabled }) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const clearCart = useCartStore((s) => s.clearCart);
  const router = useRouter();

  const handleClick = async () => {
    if (!user) {
      toast.error('Please log in to checkout');
      router.push('/auth/login');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Cart is empty');
      return;
    }
    setLoading(true);
    try {
      const createRes = await orderApi.post('/payments/create', { amount, currency: 'INR' });
      const { razorpayOrderId, key, mock } = createRes.data;

      const finalize = async (paymentId, signature) => {
        const verifyRes = await orderApi.post('/payments/verify', {
          razorpayOrderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          orderData: { ...orderData, deliveryFee: 49 },
        });
        if (verifyRes.data?.success) {
          clearCart();
          toast.success('Order placed!');
          router.push(`/orders/${verifyRes.data.orderId}`);
        } else {
          toast.error('Payment verification failed');
        }
      };

      const scriptOk = await loadRazorpayScript();
      if (!scriptOk || mock || !key || key.includes('placeholder')) {
        // Dev/mock fallback so the flow works without real Razorpay keys.
        await finalize(`pay_dev_${Date.now()}`, '');
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'FoodieExpress',
        description: 'Food order payment',
        order_id: razorpayOrderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#FF6B35' },
        handler: async (resp) => {
          try {
            await finalize(resp.razorpay_payment_id, resp.razorpay_signature);
          } catch (e) {
            toast.error('Failed to confirm order');
          }
        },
        modal: {
          ondismiss: () => toast('Payment cancelled', { icon: 'ℹ️' }),
        },
      });
      rzp.on('payment.failed', () => toast.error('Payment failed. Try the test card 4111 1111 1111 1111'));
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={disabled || loading} className="btn-primary w-full">
      {loading ? 'Processing…' : `Pay ₹${amount}`}
    </button>
  );
}
