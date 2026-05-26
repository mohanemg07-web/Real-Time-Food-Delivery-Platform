'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      addItem: (item) => {
        const { restaurantId, items } = get();
        if (restaurantId && restaurantId !== item.restaurantId) {
          const confirmClear = typeof window !== 'undefined'
            ? window.confirm('Your cart contains items from another restaurant. Clear cart and start over?')
            : false;
          if (!confirmClear) return;
          set({ items: [], restaurantId: null, restaurantName: null });
        }
        const existing = items.find((i) => i.menuItemId === item.menuItemId);
        let next;
        if (existing) {
          next = items.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          next = [...items, { ...item, quantity: 1 }];
        }
        set({
          items: next,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName || get().restaurantName,
        });
        toast.success(`${item.name} added to cart`);
      },
      removeItem: (menuItemId) => {
        const next = get().items.filter((i) => i.menuItemId !== menuItemId);
        set({
          items: next,
          ...(next.length === 0 ? { restaurantId: null, restaurantName: null } : {}),
        });
      },
      updateQuantity: (menuItemId, qty) => {
        if (qty <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity: qty } : i
          ),
        });
      },
      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),
      getTotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'cart-store' }
  )
);
