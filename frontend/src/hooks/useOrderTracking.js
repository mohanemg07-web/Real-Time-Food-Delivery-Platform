'use client';
import { useEffect, useState } from 'react';
import { getOrderSocket } from '../lib/socket';

export function useOrderTracking(orderId) {
  const [status, setStatus] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [location, setLocation] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return undefined;
    const socket = getOrderSocket();
    if (!socket) return undefined;

    const onConnect = () => {
      setConnected(true);
      socket.emit('join_order', orderId);
    };
    const onDisconnect = () => setConnected(false);
    const onStatus = (payload) => {
      if (payload?.orderId !== orderId) return;
      setStatus(payload.status);
      setStatusHistory((prev) => [...prev, payload]);
    };
    const onLocation = (payload) => {
      if (payload?.orderId !== orderId) return;
      setLocation({ lat: payload.lat, lng: payload.lng, driverId: payload.driverId, timestamp: payload.timestamp });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('order:status_update', onStatus);
    socket.on('delivery:location_update', onLocation);

    if (socket.connected) onConnect();

    return () => {
      socket.emit('leave_order', orderId);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('order:status_update', onStatus);
      socket.off('delivery:location_update', onLocation);
    };
  }, [orderId]);

  return { status, statusHistory, location, connected };
}
