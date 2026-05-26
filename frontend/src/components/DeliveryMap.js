'use client';
import { useMemo } from 'react';
import { Bike } from 'lucide-react';

const WIDTH = 600;
const HEIGHT = 360;
const PADDING = 40;
const SPAN = 0.04;

function project(lat, lng, refLat, refLng) {
  const dx = (lng - refLng) / SPAN;
  const dy = (lat - refLat) / SPAN;
  const x = PADDING + (0.5 + dx) * (WIDTH - 2 * PADDING);
  const y = HEIGHT - PADDING - (0.5 + dy) * (HEIGHT - 2 * PADDING);
  return {
    x: Math.max(PADDING, Math.min(WIDTH - PADDING, x)),
    y: Math.max(PADDING, Math.min(HEIGHT - PADDING, y)),
  };
}

export default function DeliveryMap({ driver, destination, restaurant }) {
  const refLat = destination?.lat || 28.6139;
  const refLng = destination?.lng || 77.209;

  const dest = useMemo(() => project(refLat, refLng, refLat, refLng), [refLat, refLng]);
  const rest = useMemo(
    () => project(restaurant?.lat ?? refLat + 0.01, restaurant?.lng ?? refLng + 0.01, refLat, refLng),
    [restaurant?.lat, restaurant?.lng, refLat, refLng]
  );
  const drv = useMemo(
    () => project(driver?.lat ?? refLat - 0.005, driver?.lng ?? refLng - 0.005, refLat, refLng),
    [driver?.lat, driver?.lng, refLat, refLng]
  );

  const gridLines = [];
  for (let x = PADDING; x <= WIDTH - PADDING; x += 40) {
    gridLines.push(<line key={`v-${x}`} x1={x} y1={PADDING} x2={x} y2={HEIGHT - PADDING} stroke="#e5e7eb" strokeWidth="1" />);
  }
  for (let y = PADDING; y <= HEIGHT - PADDING; y += 40) {
    gridLines.push(<line key={`h-${y}`} x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke="#e5e7eb" strokeWidth="1" />);
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold">Live Driver Location</h3>
        {driver?.driverId && (
          <span className="text-xs text-gray-500">Driver {driver.driverId}</span>
        )}
      </div>
      <div className="bg-[#f8fafc]">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#f1f5f9" />
          {gridLines}

          <line x1={rest.x} y1={rest.y} x2={dest.x} y2={dest.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
          <line x1={drv.x} y1={drv.y} x2={dest.x} y2={dest.y} stroke="#FF6B35" strokeWidth="3" />

          <g transform={`translate(${rest.x - 12} ${rest.y - 24})`}>
            <path d="M12 0 C 18 0 24 6 24 12 C 24 22 12 30 12 30 C 12 30 0 22 0 12 C 0 6 6 0 12 0 Z" fill="#22c55e" />
            <circle cx="12" cy="12" r="5" fill="#fff" />
            <text x="30" y="12" fontSize="11" fill="#1f2937">Restaurant</text>
          </g>

          <g transform={`translate(${dest.x - 12} ${dest.y - 24})`}>
            <path d="M12 0 C 18 0 24 6 24 12 C 24 22 12 30 12 30 C 12 30 0 22 0 12 C 0 6 6 0 12 0 Z" fill="#ef4444" />
            <circle cx="12" cy="12" r="5" fill="#fff" />
            <text x="30" y="12" fontSize="11" fill="#1f2937">You</text>
          </g>

          <g transform={`translate(${drv.x - 16} ${drv.y - 16})`} style={{ transition: 'transform 1.5s ease-out' }}>
            <circle cx="16" cy="16" r="16" fill="#FF6B35" />
            <circle cx="16" cy="16" r="22" fill="#FF6B35" opacity="0.25">
              <animate attributeName="r" from="16" to="26" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>
      <div className="px-4 py-3 text-sm text-gray-600 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Restaurant
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Your address
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <Bike size={14} className="text-primary" /> Driver moves in real time via Socket.io
        </div>
      </div>
    </div>
  );
}
