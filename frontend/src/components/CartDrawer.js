'use client';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const count = useCartStore((s) => s.getItemCount());
  const total = useCartStore((s) => s.getTotal());
  useEffect(() => setMounted(true), []);
  if (!mounted || count === 0) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <Link
          href="/cart"
          className="flex items-center justify-between bg-primary text-white rounded-xl px-5 py-3 shadow-lg hover:bg-primary-600 transition"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} />
            <span className="font-semibold">{count} item{count > 1 ? 's' : ''} · ₹{total}</span>
          </div>
          <span className="font-semibold">View Cart →</span>
        </Link>
      </div>
    </div>
  );
}
