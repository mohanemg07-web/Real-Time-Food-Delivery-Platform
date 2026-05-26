'use client';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost';

let orderSocket = null;
let restaurantSocket = null;

export function getOrderSocket() {
  if (typeof window === 'undefined') return null;
  if (!orderSocket) {
    orderSocket = io(`${SOCKET_URL}/orders`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return orderSocket;
}

export function getRestaurantSocket() {
  if (typeof window === 'undefined') return null;
  if (!restaurantSocket) {
    restaurantSocket = io(`${SOCKET_URL}/restaurants`, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return restaurantSocket;
}

export function disconnectAll() {
  if (orderSocket) { orderSocket.disconnect(); orderSocket = null; }
  if (restaurantSocket) { restaurantSocket.disconnect(); restaurantSocket = null; }
}
