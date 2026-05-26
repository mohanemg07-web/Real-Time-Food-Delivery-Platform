import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'FoodieExpress — Real-Time Food Delivery',
  description: 'Order from your favourite restaurants with live tracking and AI recommendations.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
