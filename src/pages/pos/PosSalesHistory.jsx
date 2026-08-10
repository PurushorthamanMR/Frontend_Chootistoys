import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBan, faPrint, faFilePdf, faFileExcel, faRotateLeft, faMoneyBillWave, faKeyboard, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import LoadingBlock from '../../components/LoadingBlock';
import Modal from '../../components/Modal';
import NumPad from '../../components/NumPad';
import ReceiptModal from '../../components/pos/ReceiptModal';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../context/CurrencyContext';
import { confirmAction, successAlert, errorAlert } from '../../lib/alert';
import { buildReceiptHtml } from '../../lib/receiptTemplate';
import { exportSalesPdf, exportSalesExcel } from '../../lib/posExport';

const PAYMENT_METHODS = ['cash', 'card', 'cheque'];

const STATUS_STYLES = {
  completed: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  voided: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  returned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
};

function SaleReturnModal({ sale, onClose, onDone }) {
  const { formatPrice } = useCurrency();
  const [qtys, setQtys] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setQtys({}), [sale?.id]);

  if (!sale) return null;
  const hasInput = Object.values(qtys).some((v) => Number(v) > 0);

  function setQty(itemId, value, remaining) {
    const clamped = Math.max(0, Math.min(remaining, Math.floor(Number(value)) || 0));
    setQtys((prev) => ({ ...prev, [itemId]: clamped }));
  }

  async function handleSave() {
    const items = Object.entries(qtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([id, quantity]) => ({ id: Number(id), quantity: Number(quantity) }));
    if (items.length === 0) return;
    setSaving(true);
    try {
      await api.post(`/pos/sales/${sale.id}/return`, { items });
      successAlert('Return processed', 'Stock and sale total have been updated.');
      onDone();
    } catch (err) {
      errorAlert('Failed to process return', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!sale} onClose={onClose} title={`Return items - Sale #${sale.id}`}>
      <div className="space-y-2">
        {(sale.items || []).map((item) => {
          const remaining = item.quantity - item.returned_quantity;
          const qty = qtys[item.id] || 0;
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Qty {item.quantity}
                  {item.returned_quantity > 0 && ` · Returned ${item.returned_quantity}`} · {formatPrice(item.price)} each
                </p>
              </div>
              {remaining > 0 ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty - 1, remaining)}
                    disabled={qty <= 0}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 disabled:opacity-30 flex items-center justify-center touch-manipulation"
                    aria-label="Decrease return quantity"
                  >
                    <FontAwesomeIcon icon={faMinus} size="xs" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.id, qty + 1, remaining)}
                    disabled={qty >= remaining}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 disabled:opacity-30 flex items-center justify-center touch-manipulation"
                    aria-label="Increase return quantity"
                  >
                    <FontAwesomeIcon icon={faPlus} size="xs" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-gray-400 shrink-0">Fully returned</span>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !hasInput}
        className="mt-4 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-sm"
      >
        {saving ? 'Processing...' : 'Process Return'}
      </button>
    </Modal>
  );
}

function SettleBalanceModal({ sale, onClose, onDone }) {
  const { formatPrice } = useCurrency();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAmount(sale ? String(Math.round(Number(sale.balance_due))) : '');
    setMethod('cash');
    setKeyboardOpen(false);
  }, [sale?.id]);

  if (!sale) return null;
  const balanceDue = Number(sale.balance_due);
  const amountValue = Math.min(Number(amount) || 0, balanceDue);

  async function handleSave() {
    if (amountValue <= 0) return;
    setSaving(true);
    try {
      await api.post(`/pos/sales/${sale.id}/payments`, { amount: amountValue, payment_method: method });
      successAlert('Payment recorded', 'The balance has been updated.');
      onDone();
    } catch (err) {
      errorAlert('Failed to record payment', err.response?.data?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!sale} onClose={onClose} title={`Settle balance - Sale #${sale.id}`} align="start">
      {/* NumPad is fixed to the viewport bottom and stays there regardless of scrolling,
          so this content is capped to the space above it and made scrollable - otherwise
          on shorter screens part of it can render hidden underneath the NumPad. */}
      <div className="max-h-[calc(100vh_-_27rem)] overflow-y-auto">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Balance due: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(balanceDue)}</span>
        </p>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`capitalize text-xs font-semibold py-2 rounded-lg border touch-manipulation ${
                method === m
                  ? 'bg-wa-green text-white border-wa-green'
                  : 'border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="min-w-[4rem] text-center text-3xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-neutral-700 pb-1 px-2">
            {formatPrice(amountValue)}
          </span>
          <button
            type="button"
            onClick={() => setKeyboardOpen((v) => !v)}
            aria-label="Toggle on-screen keyboard"
            className={`w-10 h-10 rounded-full flex items-center justify-center touch-manipulation ${
              keyboardOpen ? 'bg-wa-green text-white' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'
            }`}
          >
            <FontAwesomeIcon icon={faKeyboard} size="sm" />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || amountValue <= 0}
          className="w-full bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-sm mt-2"
        >
          {saving ? 'Saving...' : `Record ${formatPrice(amountValue)} Payment`}
        </button>
      </div>

      {keyboardOpen && (
        <NumPad
          value={amount}
          onChange={(val) => setAmount(String(Math.min(Number(val) || 0, balanceDue)))}
          onEnter={() => setKeyboardOpen(false)}
          onClose={() => setKeyboardOpen(false)}
        />
      )}
    </Modal>
  );
}

export default function PosSalesHistory() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [receiptSale, setReceiptSale] = useState(null);
  const [printingId, setPrintingId] = useState(null);
  const [returnSale, setReturnSale] = useState(null);
  const [loadingReturnId, setLoadingReturnId] = useState(null);
  const [settleSale, setSettleSale] = useState(null);
  const canVoid = ['Admin', 'SuperAdmin'].includes(user?.role);
  const canReturn = ['Admin', 'SuperAdmin'].includes(user?.role);

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

  async function handlePrint(sale) {
    setPrintingId(sale.id);
    try {
      const { data } = await api.get(`/pos/sales/${sale.id}`);
      setReceiptSale(data);
    } catch (err) {
      errorAlert('Failed to load receipt', err.response?.data?.message);
    } finally {
      setPrintingId(null);
    }
  }

  async function handleOpenReturn(sale) {
    setLoadingReturnId(sale.id);
    try {
      const { data } = await api.get(`/pos/sales/${sale.id}`);
      setReturnSale(data);
    } catch (err) {
      errorAlert('Failed to load sale', err.response?.data?.message);
    } finally {
      setLoadingReturnId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">POS Sales History</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportSalesPdf(sales, settings)}
            disabled={sales.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => exportSalesExcel(sales)}
            disabled={sales.length === 0}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFileExcel} />
            Export Excel
          </button>
        </div>
      </div>

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
                <th className="p-3">Payment</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3">Receipt</th>
                <th className="p-3">Actions</th>
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
                  <td className="p-3 capitalize">{s.payment_method}</td>
                  <td className="p-3">
                    {Number(s.balance_due) > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-semibold">{formatPrice(s.balance_due)}</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handlePrint(s)}
                      disabled={printingId === s.id}
                      aria-label="Print receipt"
                      title="Print receipt"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-40"
                    >
                      <FontAwesomeIcon icon={faPrint} size="xs" />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {Number(s.balance_due) > 0 && s.status === 'completed' && (
                        <button
                          onClick={() => setSettleSale(s)}
                          aria-label="Settle balance"
                          title="Settle balance"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} size="xs" />
                        </button>
                      )}
                      {canReturn && s.status === 'completed' && (
                        <button
                          onClick={() => handleOpenReturn(s)}
                          disabled={loadingReturnId === s.id}
                          aria-label="Return items"
                          title="Return items"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-40"
                        >
                          <FontAwesomeIcon icon={faRotateLeft} size="xs" />
                        </button>
                      )}
                      {canVoid && s.status === 'completed' && (
                        <button
                          onClick={() => handleVoid(s)}
                          aria-label="Void sale"
                          title="Void sale"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                        >
                          <FontAwesomeIcon icon={faBan} size="xs" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-4 text-gray-500 dark:text-gray-400">
                    No sales found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <ReceiptModal
        open={!!receiptSale}
        onClose={() => setReceiptSale(null)}
        title={`Receipt #${receiptSale?.id ?? ''}`}
        html={receiptSale ? buildReceiptHtml({ sale: receiptSale, settings, formatPrice }) : ''}
      />
      <SaleReturnModal
        sale={returnSale}
        onClose={() => setReturnSale(null)}
        onDone={() => {
          setReturnSale(null);
          load();
        }}
      />
      <SettleBalanceModal
        sale={settleSale}
        onClose={() => setSettleSale(null)}
        onDone={() => {
          setSettleSale(null);
          load();
        }}
      />
    </div>
  );
}
