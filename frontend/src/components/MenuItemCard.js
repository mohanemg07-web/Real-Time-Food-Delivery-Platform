'use client';
import { Plus, Star } from 'lucide-react';
import { useCartStore } from '../store/cartStore';

export default function MenuItemCard({ item, restaurantId, restaurantName }) {
  const addItem = useCartStore((s) => s.addItem);
  const img = item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=70';

  return (
    <div className="card p-4 flex gap-4 items-stretch">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-4 h-4 border-2 ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-sm`}
            aria-label={item.isVeg ? 'Veg' : 'Non-veg'}
          >
            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
          <h4 className="font-semibold text-base">{item.name}</h4>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-green-700">
          <Star size={12} fill="currentColor" /> {item.rating?.toFixed(1)}
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
        <p className="text-base font-semibold mt-2">₹{item.price}</p>
      </div>
      <div className="relative w-28 sm:w-32 flex-shrink-0">
        <img src={img} alt={item.name} className="w-full h-28 sm:h-32 object-cover rounded-lg" loading="lazy" />
        <button
          onClick={() =>
            addItem({
              menuItemId: item._id,
              name: item.name,
              price: item.price,
              image: img,
              restaurantId,
              restaurantName,
            })
          }
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-white border border-primary text-primary text-sm font-semibold shadow flex items-center gap-1"
        >
          <Plus size={14} /> ADD
        </button>
      </div>
    </div>
  );
}
