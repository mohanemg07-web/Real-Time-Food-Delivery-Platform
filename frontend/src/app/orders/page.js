'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderApi } from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLOR = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    orderApi
      .get(`/user/${user.id}`)
      .then((res) => !cancelled && setOrders(res.data.orders || []))
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user, router]);

  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
      )}
      {error && !loading && <p className="text-red-600 text-sm">{error}</p>}
      {!loading && orders.length === 0 && (
        <p className="text-center text-gray-500 py-10">No orders yet.</p>
      )}
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o._id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">{o.restaurantName || 'Order'}</p>
              <p className="text-sm text-gray-500 truncate">
                {(o.items || []).map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(o.createdAt).toLocaleString()} · ₹{o.totalAmount}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`badge ${STATUS_COLOR[o.status] || 'bg-gray-100 text-gray-700'}`}>
                {o.status.replace(/_/g, ' ')}
              </span>
              <Link href={`/orders/${o._id}`} className="btn-outline text-sm py-1.5">Track</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
