import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';
import { confirmAction, successAlert, errorAlert } from '../lib/alert';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shipping_name: user?.name || '',
    shipping_phone: '',
    shipping_address: '',
  });
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Your cart is empty</h2>
        <Link to="/products" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const ok = await confirmAction({
      title: 'Place this order?',
      text: `Total: ${formatPrice(total)} - Cash on Delivery`,
      confirmText: 'Yes, place order',
      icon: 'question',
    });
    if (!ok) return;

    setPlacing(true);
    try {
      const payload = {
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        ...form,
      };
      const { data } = await api.post('/orders', payload);
      clearCart();
      await successAlert('Order placed!', `Order #${data.id} has been submitted.`);
      navigate('/my-orders', { state: { justPlacedOrderId: data.id } });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to place order';
      setError(message);
      errorAlert('Order failed', message);
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">Checkout</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none p-5 space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Shipping Details</h3>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Full Name</label>
            <input
              required
              value={form.shipping_name}
              onChange={(e) => setForm({ ...form, shipping_name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Phone Number</label>
            <input
              required
              value={form.shipping_phone}
              onChange={(e) => setForm({ ...form, shipping_phone: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Delivery Address</label>
            <textarea
              required
              value={form.shipping_address}
              onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Payment Method</label>
            <div className="border border-gray-300 dark:border-neutral-700 rounded px-3 py-2 bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
              Cash on Delivery (COD)
            </div>
          </div>
          <button
            type="submit"
            disabled={placing}
            className="w-full bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white font-semibold py-2.5 rounded-md"
          >
            {placing ? 'Placing order...' : `Place Order (${formatPrice(total)})`}
          </button>
        </form>

        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none p-5 h-fit">
          <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Order Summary</h3>
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm text-gray-800 dark:text-gray-200">
                <span>{item.name} x{item.quantity}</span>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-neutral-700 pt-3 font-bold text-gray-900 dark:text-gray-100">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
