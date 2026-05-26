'use client';
import Link from 'next/link';
import { Star, Clock, IndianRupee } from 'lucide-react';

export default function RestaurantCard({ restaurant }) {
  const img = restaurant.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
  return (
    <Link
      href={`/restaurant/${restaurant._id}`}
      className="card overflow-hidden hover:shadow-md transition group"
    >
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        <img
          src={img}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {restaurant.cuisine?.slice(0, 2).map((c) => (
            <span key={c} className="badge bg-white/90 text-gray-700">{c}</span>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg leading-tight">{restaurant.name}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-600 text-white text-sm font-semibold">
            <Star size={14} fill="currentColor" /> {restaurant.rating?.toFixed(1)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{restaurant.description}</p>
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1"><Clock size={14} /> {restaurant.deliveryTime}</span>
          <span className="inline-flex items-center gap-1"><IndianRupee size={14} /> Min {restaurant.minimumOrder}</span>
        </div>
      </div>
    </Link>
  );
}
