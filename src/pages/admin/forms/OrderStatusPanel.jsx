import { formatRs } from '../../../lib/format';

const STATUSES = ['pending', 'successful', 'return', 'cancelled'];

export const STATUS_LABELS = {
  pending: 'Pending',
  successful: 'Approved',
  return: 'Return',
  cancelled: 'Cancelled',
};

export default function OrderStatusPanel({
  order,
  statusDraft,
  setStatusDraft,
  onStatusSave,
  savingStatus,
  returnQtys,
  setReturnQtys,
  onReturnSave,
  savingReturn,
}) {
  const hasReturnInput = Object.values(returnQtys).some((v) => Number(v) > 0);

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Status</label>
        <div className="flex gap-2">
          <select
            value={statusDraft}
            onChange={(e) => setStatusDraft(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={onStatusSave}
            disabled={savingStatus || statusDraft === order.status}
            className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md whitespace-nowrap"
          >
            Update
          </button>
        </div>
        {statusDraft === 'successful' && order.status !== 'successful' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">Approving will reduce stock for these items.</p>
        )}
        {statusDraft !== 'successful' && order.status === 'successful' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5">This will restore stock back to the catalog.</p>
        )}
      </div>

      <div>
        <p className="text-xs font-medium mb-2 text-gray-600 dark:text-gray-400">
          Items{order.status !== 'successful' && ' (returns only apply to approved orders)'}
        </p>
        <div className="space-y-2">
          {order.items.map((item) => {
            const remaining = item.quantity - (item.returned_quantity || 0);
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.product_name}{item.product_code && ` (#${item.product_code})`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Qty {item.quantity}
                    {item.returned_quantity > 0 && ` · Returned ${item.returned_quantity}`} · {formatRs(item.price)} each
                  </p>
                </div>
                {order.status === 'successful' && remaining > 0 && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Return:</label>
                    <input
                      type="number"
                      min="0"
                      max={remaining}
                      value={returnQtys[item.id] || ''}
                      onChange={(e) => setReturnQtys({ ...returnQtys, [item.id]: e.target.value })}
                      className="w-16 border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {order.status === 'successful' && (
          <button
            onClick={onReturnSave}
            disabled={savingReturn || !hasReturnInput}
            className="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 rounded-md"
          >
            Process Return
          </button>
        )}
      </div>
    </div>
  );
}
