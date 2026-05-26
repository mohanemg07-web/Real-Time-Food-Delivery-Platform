'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingCart, User, LogOut, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { user, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl">
          <UtensilsCrossed size={26} />
          <span>FoodieExpress</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-700">
          <Link href="/" className="hover:text-primary">Home</Link>
          <Link href="/orders" className="hover:text-primary">Orders</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
            aria-label="Cart"
          >
            <ShoppingCart size={20} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {mounted && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100">
                <User size={16} />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary">Login</Link>
              <Link href="/auth/register" className="btn-primary text-sm py-1.5 px-3">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
