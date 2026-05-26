'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { restaurantApi } from '../lib/axios';
import RestaurantCard from '../components/RestaurantCard';

const CUISINES = ['All', 'Indian', 'Chinese', 'Italian', 'American', 'Japanese'];

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    restaurantApi
      .get('/')
      .then((res) => {
        if (cancelled) return;
        setRestaurants(res.data.restaurants || []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const cuisineOk = cuisine === 'All' || (r.cuisine || []).some((c) => c.toLowerCase() === cuisine.toLowerCase());
      if (!cuisineOk) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.cuisine || []).some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [restaurants, search, cuisine]);

  return (
    <div>
      <section className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-700 text-white px-6 py-10 mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">Hungry? We've got you covered.</h1>
        <p className="mt-2 text-white/90">Order from top restaurants in your city with live tracking.</p>
        <div className="mt-5 flex items-center bg-white rounded-xl shadow px-3 py-2 max-w-xl">
          <Search className="text-gray-400" size={20} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants or dishes"
            className="flex-1 px-3 py-1.5 text-gray-900 focus:outline-none border-0 focus:ring-0"
          />
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CUISINES.map((c) => (
          <button
            key={c}
            onClick={() => setCuisine(c)}
            className={`px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap ${
              cuisine === c
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-center text-gray-500 py-12">Couldn't load restaurants: {error}</p>
      )}

      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <RestaurantCard key={r._id} restaurant={r} />
          ))}
          {filtered.length === 0 && (
            <p className="text-gray-500 col-span-full text-center py-10">No restaurants match your filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
