'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import RazorpayButton from '../../components/RazorpayButton';

const DELIVERY_FEE = 49;

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const subtotal = useCartStore((s) => s.getTotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const { user } = useAuthStore();
  const router = useRouter();

  const [address, setAddress] = useState({
    street: '',
    city: 'Delhi',
    state: 'DL',
    pincode: '110001',
    coordinates: { lat: 28.6139, lng: 77.209 },
  });

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
        {items.length === 0 && (
          <div className="card p-8 text-center text-gray-500">
            <p className="mb-4">Your cart is empty.</p>
            <button onClick={() => router.push('/')} className="btn-primary">Browse Restaurants</button>
          </div>
        )}
        {items.length > 0 && (
          <div className="card divide-y divide-gray-100">
            {restaurantName && (
              <div className="px-4 py-3 text-sm text-gray-600">
                From <span className="font-semibold text-gray-900">{restaurantName}</span>
              </div>
            )}
            {items.map((it) => (
              <div key={it.menuItemId} className="flex items-center gap-3 p-4">
                <img
                  src={it.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=70'}
                  alt={it.name}
                  className="w-16 h-16 rounded object-cover bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{it.name}</p>
                  <p className="text-sm text-gray-500">₹{it.price}</p>
                </div>
                <div className="flex items-center gap-2 border rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateQuantity(it.menuItemId, it.quantity - 1)}
                    className="text-gray-600 hover:text-primary"
                    aria-label="Decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-semibold w-6 text-center">{it.quantity}</span>
                  <button
                    onClick={() => updateQuantity(it.menuItemId, it.quantity + 1)}
                    className="text-gray-600 hover:text-primary"
                    aria-label="Increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="w-20 text-right font-semibold">₹{it.price * it.quantity}</div>
                <button
                  onClick={() => removeItem(it.menuItemId)}
                  className="text-red-500 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="card mt-6 p-5">
            <h2 className="font-semibold mb-3">Delivery Address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600">Street</label>
                <input
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="input mt-1"
                  placeholder="House no. and street"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">City</label>
                <input
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">State</label>
                <input
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Pincode</label>
                <input
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="input mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="card p-5 h-fit lg:sticky lg:top-20">
        <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
          <div className="flex justify-between"><span>Delivery fee</span><span>₹{items.length > 0 ? DELIVERY_FEE : 0}</span></div>
          <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-2 mt-2">
            <span>Total</span><span>₹{total}</span>
          </div>
        </div>
        <div className="mt-4">
          {!user && (
            <p className="text-xs text-gray-500 mb-2">
              You need to <button onClick={() => router.push('/auth/login')} className="text-primary font-semibold">log in</button> to checkout.
            </p>
          )}
          <RazorpayButton
            amount={total}
            disabled={items.length === 0}
            orderData={{
              restaurantId,
              restaurantName,
              items,
              deliveryAddress: address,
            }}
          />
          <p className="text-[11px] text-gray-500 mt-2 text-center">
            Test card: 4111 1111 1111 1111 · any CVV · any future date
          </p>
        </div>
      </aside>
    </div>
  );
}
