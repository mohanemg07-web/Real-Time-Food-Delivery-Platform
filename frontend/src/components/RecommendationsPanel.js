'use client';
import { Sparkles, Plus } from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { useCartStore } from '../store/cartStore';

export default function RecommendationsPanel({ userId, restaurantId, restaurantName }) {
  const { recommendations, loading, error } = useRecommendations(userId);
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-primary" size={20} />
        <h3 className="font-semibold text-lg">AI Recommendations for You</h3>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-gray-500">Recommendations are warming up. Try again in a few moments.</p>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <p className="text-sm text-gray-500">Order a few meals — your personalized picks will appear here.</p>
      )}

      {!loading && recommendations.length > 0 && (
        <ul className="space-y-3">
          {recommendations.map((r, idx) => (
            <li key={`${r.name}-${idx}`} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100">
              <div>
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{r.category} · ₹{r.price}</p>
                <p className="text-sm text-gray-700 mt-1">{r.reason}</p>
              </div>
              <button
                onClick={() =>
                  addItem({
                    menuItemId: `${restaurantId || 'rec'}-${r.name}`,
                    name: r.name,
                    price: r.price,
                    image: '',
                    restaurantId: restaurantId || 'rec',
                    restaurantName: restaurantName || '',
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-primary text-primary text-xs font-semibold"
              >
                <Plus size={12} /> Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
