'use client';
import { Check, Clock, ChefHat, Bike, PackageCheck } from 'lucide-react';

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', Icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', Icon: Check },
  { key: 'PREPARING', label: 'Preparing', Icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', Icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', Icon: PackageCheck },
];

export default function OrderStatusTimeline({ status }) {
  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.key === status));
  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const reached = idx <= currentIdx;
          const isLast = idx === STEPS.length - 1;
          const Icon = step.Icon;
          return (
            <div key={step.key} className="flex-1 flex items-center">
              <div className="flex flex-col items-center min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    reached ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className={`mt-2 text-[11px] sm:text-xs text-center font-medium ${reached ? 'text-primary' : 'text-gray-500'}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded ${idx < currentIdx ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
