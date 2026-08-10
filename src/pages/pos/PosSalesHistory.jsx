import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import LoadingBlock from '../../components/LoadingBlock';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { confirmAction, successAlert, errorAlert } from '../../lib/alert';

const STATUS_STYLES = {
  completed: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  voided: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function PosSalesHistory() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const canVoid = ['Admin', 'SuperAdmin'].includes(user?.role);

  function load() {
    setLoading(true);
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    api
      .get('/pos/sales', { params })
      .then((res) => setSales(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, [from, to]);

  async function handleVoid(sale) {
    const ok = await confirmAction({
      title: 'Void this sale?',
      text: `This restores stock for all items in sale #${sale.id}. This cannot be undone.`,
      confirmText: 'Void Sale',
    });
    if (!ok) return;
    try {
      await api.post(`/pos/sales/${sale.id}/void`);
      successAlert('Sale voided', 'Stock has been restored.');
      load();
    } catch (err) {
      errorAlert('Failed to void sale', err.response?.data?.message);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">POS Sales History</h2>

      <div className="flex flex-wrap gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <LoadingBlock className="py-10" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Date</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                {canVoid && <th className="p-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                  <td className="p-3">{s.id}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="p-3">{s.staff_name}</td>
                  <td className="p-3 text-gray-500 dark:text-gray-400">{s.customer_name || 'Walk-in'}</td>
                  <td className="p-3 font-semibold">{formatPrice(s.total_amount)}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  {canVoid && (
                    <td className="p-3">
                      {s.status === 'completed' && (
                        <button
                          onClick={() => handleVoid(s)}
                          aria-label="Void sale"
                          title="Void sale"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          <FontAwesomeIcon icon={faBan} size="xs" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={canVoid ? 7 : 6} className="p-4 text-gray-500 dark:text-gray-400">
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
