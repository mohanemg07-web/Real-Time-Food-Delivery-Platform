'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, Clock, IndianRupee } from 'lucide-react';
import { restaurantApi } from '../../../lib/axios';
import MenuItemCard from '../../../components/MenuItemCard';
import CartDrawer from '../../../components/CartDrawer';

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      restaurantApi.get(`/${id}`),
      restaurantApi.get(`/${id}/menu`),
    ])
      .then(([rRes, mRes]) => {
        if (cancelled) return;
        setRestaurant(rRes.data.restaurant);
        setMenu(mRes.data.menu || {});
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-32 rounded-xl" />
      </div>
    );
  }

  if (error || !restaurant) {
    return <p className="text-center text-gray-500 py-12">Restaurant not found.</p>;
  }

  return (
    <div className="pb-24">
      <div className="card overflow-hidden mb-6">
        <div className="relative aspect-[16/6] bg-gray-100">
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{restaurant.name}</h1>
              <p className="text-gray-600 mt-1">{restaurant.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-gray-700">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded font-semibold">
                  <Star size={14} fill="currentColor" /> {restaurant.rating?.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1"><Clock size={14} /> {restaurant.deliveryTime}</span>
                <span className="inline-flex items-center gap-1"><IndianRupee size={14} /> Min ₹{restaurant.minimumOrder}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {restaurant.cuisine?.map((c) => (
                  <span key={c} className="badge bg-gray-100 text-gray-700">{c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(menu).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="text-xl font-bold mb-3">{category}</h2>
          <div className="grid gap-3">
            {items.map((item) => (
              <MenuItemCard key={item._id} item={item} restaurantId={restaurant._id} restaurantName={restaurant.name} />
            ))}
          </div>
        </section>
      ))}

      <CartDrawer />
    </div>
  );
}
