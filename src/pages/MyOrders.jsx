import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShapes } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import { useCurrency } from '../context/CurrencyContext';
import Pagination from '../components/Pagination';
import LoadingBlock from '../components/LoadingBlock';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  successful: 'bg-wa-green/10 text-wa-green-dark dark:bg-wa-green/20 dark:text-wa-green',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const PAGE_SIZE = 6;

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    api.get('/orders/mine').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">You have no orders yet</h2>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const pagedOrders = orders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">My Orders</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {pagedOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none overflow-hidden flex flex-col"
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-neutral-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {new Date(order.created_at).toLocaleString()}
              </p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div className="p-4 space-y-3 flex-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {item.product_image ? (
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <FontAwesomeIcon icon={faShapes} className="text-gray-400 text-lg" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatPrice(order.total_amount)}</span>
            </div>

            {order.shipping_phone && (
              <p className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
                Deliver to: {order.shipping_name}{order.shipping_address ? `, ${order.shipping_address}` : ''} ({order.shipping_phone})
              </p>
            )}
          </div>
        ))}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
