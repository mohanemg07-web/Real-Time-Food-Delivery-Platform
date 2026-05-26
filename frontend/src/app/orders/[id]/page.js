'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { orderApi, deliveryApi } from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { useOrderTracking } from '../../../hooks/useOrderTracking';
import OrderStatusTimeline from '../../../components/OrderStatusTimeline';
import DeliveryMap from '../../../components/DeliveryMap';
import RecommendationsPanel from '../../../components/RecommendationsPanel';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { status: liveStatus, location: liveLocation, connected } = useOrderTracking(id);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      orderApi.get(`/${id}`).then((r) => r.data.order),
      deliveryApi.get(`/${id}`).then((r) => r.data.delivery).catch(() => null),
    ])
      .then(([o, d]) => {
        if (cancelled) return;
        setOrder(o);
        setDelivery(d);
      })
      .catch((err) => !cancelled && setError(err.response?.data?.error || err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  // Refresh delivery snapshot when status updates to keep destination/driverId fresh.
  useEffect(() => {
    if (!id || !liveStatus) return;
    deliveryApi.get(`/${id}`).then((r) => setDelivery(r.data.delivery)).catch(() => {});
  }, [id, liveStatus]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-64" />
        <div className="skeleton h-40" />
      </div>
    );
  }
  if (error || !order) {
    return <p className="text-center text-gray-500 py-10">{error || 'Order not found.'}</p>;
  }

  const currentStatus = liveStatus || order.status;
  const driver = liveLocation
    ? { ...liveLocation, driverId: liveLocation.driverId || delivery?.driverId }
    : delivery?.currentLocation
    ? { lat: delivery.currentLocation.lat, lng: delivery.currentLocation.lng, driverId: delivery.driverId }
    : null;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{order.restaurantName || 'Order'}</h1>
            <p className="text-sm text-gray-500">Order #{order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">₹{order.totalAmount}</p>
          </div>
        </div>
        <div className="mt-5">
          <OrderStatusTimeline status={currentStatus} />
          <p className="mt-3 text-xs text-gray-500 text-center">
            {connected ? 'Connected · live updates streaming' : 'Connecting to live updates…'}
          </p>
        </div>
      </div>

      <DeliveryMap
        driver={driver}
        destination={delivery?.destinationLocation || order.deliveryAddress?.coordinates}
        restaurant={delivery?.destinationLocation
          ? { lat: delivery.destinationLocation.lat + 0.01, lng: delivery.destinationLocation.lng + 0.01 }
          : null}
      />

      <div className="card p-5">
        <h3 className="font-semibold mb-3">Items</h3>
        <ul className="divide-y divide-gray-100">
          {(order.items || []).map((it, idx) => (
            <li key={idx} className="py-2 flex items-center justify-between text-sm">
              <span>{it.quantity}× {it.name}</span>
              <span className="font-semibold">₹{it.price * it.quantity}</span>
            </li>
          ))}
        </ul>
      </div>

      {user && (
        <RecommendationsPanel
          userId={user.id}
          restaurantId={order.restaurantId}
          restaurantName={order.restaurantName}
        />
      )}
    </div>
  );
}
