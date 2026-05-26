import axios from 'axios';

const userBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost/api/users';
const restaurantBase = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || 'http://localhost/api/restaurants';
const orderBase = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost/api/orders';
const deliveryBase = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || 'http://localhost/api/deliveries';

export const userApi = axios.create({ baseURL: userBase, timeout: 15000 });
export const restaurantApi = axios.create({ baseURL: restaurantBase, timeout: 15000 });
export const orderApi = axios.create({ baseURL: orderBase, timeout: 15000 });
export const deliveryApi = axios.create({ baseURL: deliveryBase, timeout: 15000 });

const attachToken = (config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

[userApi, restaurantApi, orderApi, deliveryApi].forEach((api) => {
  api.interceptors.request.use(attachToken);
});
