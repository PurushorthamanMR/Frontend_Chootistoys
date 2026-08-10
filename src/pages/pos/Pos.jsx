import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faXmark,
  faPlus,
  faMinus,
  faPause,
  faClockRotateLeft,
  faLock,
  faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import LoadingBlock from '../../components/LoadingBlock';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../context/CurrencyContext';
import { confirmAction, successAlert, errorAlert } from '../../lib/alert';

function OpenShiftScreen({ onOpened }) {
  const [openingCash, setOpeningCash] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleOpen(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post('/pos/shifts', { opening_cash: openingCash || 0 });
      onOpened(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open shift');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 px-4">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm p-6 text-center">
        <FontAwesomeIcon icon={faLock} className="text-3xl text-wa-green-dark dark:text-wa-green mb-3" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Open a Shift</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter the starting cash in the drawer to begin taking sales.
        </p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handleOpen} className="space-y-3">
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Opening cash amount"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-center"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-lg"
          >
            {saving ? 'Opening...' : 'Open Shift'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CloseShiftModal({ shift, open, onClose, onClosed }) {
  const { formatPrice } = useCurrency();
  const [closingCash, setClosingCash] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleClose(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await api.post(`/pos/shifts/${shift.id}/close`, { closing_cash: closingCash || 0 });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close shift');
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    setClosingCash('');
    setResult(null);
    onClosed();
  }

  return (
    <Modal open={open} onClose={result ? handleDone : onClose} title="Close Shift">
      {result ? (
        <div className="space-y-2 text-sm">
          <p className="text-gray-700 dark:text-gray-300">
            Expected cash: <span className="font-semibold">{formatPrice(result.expected_cash)}</span>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Counted cash: <span className="font-semibold">{formatPrice(result.closing_cash)}</span>
          </p>
          <p
            className={`font-bold ${
              Number(result.closing_cash) === Number(result.expected_cash) ? 'text-wa-green-dark dark:text-wa-green' : 'text-red-600'
            }`}
          >
            Variance: {formatPrice(Number(result.closing_cash) - Number(result.expected_cash))}
          </p>
          <button
            onClick={handleDone}
            className="w-full mt-3 bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-lg"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleClose} className="space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Count the cash drawer and enter the total below.
          </p>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="Counted cash amount"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? 'Closing...' : 'Close Shift'}
          </button>
        </form>
      )}
    </Modal>
  );
}

function QuantityPickerModal({ product, initialQuantity, onClose, onConfirm }) {
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(initialQuantity);

  if (!product) return null;
  const unitPrice = Number(product.discount_percent) > 0 ? Number(product.discount_price) : Number(product.sale_price);
  const atMax = quantity >= product.stock;

  return (
    <Modal open={!!product} onClose={onClose} title="Add to Order">
      <div className="flex items-center gap-3 mb-4">
        <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-neutral-800" />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
          <p className="text-wa-green-dark dark:text-wa-green font-bold">{formatPrice(unitPrice)}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-5">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 flex items-center justify-center text-2xl font-light text-gray-900 dark:text-gray-100"
          aria-label="Decrease quantity"
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span className="w-16 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
          disabled={atMax}
          className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 disabled:opacity-30 flex items-center justify-center text-2xl font-light text-gray-900 dark:text-gray-100"
          aria-label="Increase quantity"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      {atMax && <p className="text-center text-xs text-red-500 mb-3">Only {product.stock} in stock</p>}

      <button
        type="button"
        onClick={() => onConfirm(product, quantity)}
        className="w-full bg-wa-green hover:bg-wa-green-dark active:bg-wa-green-dark text-white font-bold py-3.5 rounded-xl text-base"
      >
        Add {quantity} to Order · {formatPrice(unitPrice * quantity)}
      </button>
    </Modal>
  );
}

function HeldOrdersModal({ open, onClose, holds, onResume, onDelete }) {
  return (
    <Modal open={open} onClose={onClose} title="Held Orders">
      {holds.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No held orders.</p>
      ) : (
        <div className="space-y-2">
          {holds.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-2 border border-gray-200 dark:border-neutral-800 rounded-lg p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {h.customer_name || 'Walk-in'} · {h.items.length} item{h.items.length !== 1 ? 's' : ''}
                </p>
                {h.note && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{h.note}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => onResume(h)}
                  className="text-xs font-semibold bg-wa-green hover:bg-wa-green-dark text-white px-3 py-1.5 rounded-md"
                >
                  Resume
                </button>
                <button
                  onClick={() => onDelete(h.id)}
                  className="text-xs font-semibold border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function Pos() {
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();

  const [shift, setShift] = useState(undefined); // undefined = loading, null = none open
  const [showCloseShift, setShowCloseShift] = useState(false);

  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cart, setCart] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [taxPercent, setTaxPercent] = useState('0');
  const [serviceChargePercent, setServiceChargePercent] = useState('0');
  const [checkingOut, setCheckingOut] = useState(false);

  const [holds, setHolds] = useState([]);
  const [showHolds, setShowHolds] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);

  function loadShift() {
    api.get('/pos/shifts/current').then((res) => setShift(res.data));
  }

  useEffect(loadShift, []);

  useEffect(() => {
    if (!shift) return;
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
    refreshHolds();
  }, [shift]);

  useEffect(() => {
    if (settings) {
      setTaxPercent(String(settings.pos_tax_percent ?? 0));
      setServiceChargePercent(String(settings.pos_service_charge_percent ?? 0));
    }
  }, [settings]);

  function loadProducts() {
    if (!shift) return;
    setLoadingProducts(true);
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    api
      .get('/products', { params })
      .then((res) => setProducts(res.data))
      .finally(() => setLoadingProducts(false));
  }

  useEffect(loadProducts, [shift, category, search]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!customerSearch.trim()) {
        setCustomerResults([]);
        return;
      }
      api.get('/customers', { params: { search: customerSearch.trim() } }).then((res) => setCustomerResults(res.data));
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  function refreshHolds() {
    api.get('/pos/holds').then((res) => setHolds(res.data)).catch(() => {});
  }

  // Tapping a product opens the quantity-picker popup instead of adding
  // straight to the cart - this upserts the exact quantity chosen there
  // (as opposed to incrementItem/decrementItem below, which just nudge an
  // already-in-cart line by one from the Current Order panel).
  function setCartQuantity(product, quantity) {
    const unitPrice = Number(product.discount_percent) > 0 ? Number(product.discount_price) : Number(product.sale_price);
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => (i.product_id === product.id ? { ...i, quantity } : i));
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          product_code: product.product_code,
          image: product.image,
          price: unitPrice,
          stock: product.stock,
          quantity,
        },
      ];
    });
    setPendingProduct(null);
  }

  function incrementItem(productId) {
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId && i.quantity < i.stock ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }

  function decrementItem(productId) {
    setCart((prev) => {
      const item = prev.find((i) => i.product_id === productId);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.product_id !== productId);
      return prev.map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  function resetCart() {
    setCart([]);
    setCustomer(null);
    setCustomerSearch('');
    setDiscountAmount('0');
    setTaxPercent(String(settings?.pos_tax_percent ?? 0));
    setServiceChargePercent(String(settings?.pos_service_charge_percent ?? 0));
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const afterDiscount = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const taxAmount = afterDiscount * ((Number(taxPercent) || 0) / 100);
  const serviceAmount = afterDiscount * ((Number(serviceChargePercent) || 0) / 100);
  const total = afterDiscount + taxAmount + serviceAmount;

  async function handleHold() {
    if (cart.length === 0) return;
    try {
      await api.post('/pos/holds', {
        items: cart,
        customer_id: customer?.id || null,
        note: customer?.name ? `For ${customer.name}` : undefined,
      });
      resetCart();
      refreshHolds();
      successAlert('Order held', 'You can resume it anytime from Held Orders.');
    } catch (err) {
      errorAlert('Failed to hold order', err.response?.data?.message);
    }
  }

  function resumeHold(hold) {
    setCart(hold.items);
    if (hold.customer_id) {
      setCustomer({ id: hold.customer_id, name: hold.customer_name });
    }
    setShowHolds(false);
    api.delete(`/pos/holds/${hold.id}`).then(refreshHolds);
  }

  async function deleteHold(id) {
    await api.delete(`/pos/holds/${id}`);
    refreshHolds();
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    const confirmed = await confirmAction({
      title: 'Complete this sale?',
      text: `Total: ${formatPrice(total)}`,
      confirmText: 'Complete Sale',
    });
    if (!confirmed) return;

    setCheckingOut(true);
    try {
      await api.post('/pos/sales', {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_id: customer?.id || null,
        discount_amount: Number(discountAmount) || 0,
        tax_percent: Number(taxPercent) || 0,
        service_charge_percent: Number(serviceChargePercent) || 0,
      });
      resetCart();
      loadProducts();
      successAlert('Sale complete', `Total collected: ${formatPrice(total)}`);
    } catch (err) {
      errorAlert('Sale failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (shift === undefined) return <LoadingBlock className="py-16" />;
  if (!shift) return <OpenShiftScreen onOpened={setShift} />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex items-center rounded-full w-full sm:flex-1 sm:w-auto sm:max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 ml-4 shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search items..."
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 sm:py-2 text-base sm:text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="w-9 h-9 mr-1 text-gray-400 touch-manipulation" aria-label="Clear search">
                <FontAwesomeIcon icon={faXmark} size="sm" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowHolds(true)}
            className="flex items-center gap-2 text-sm font-semibold px-3.5 py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 touch-manipulation"
          >
            <FontAwesomeIcon icon={faClockRotateLeft} />
            Held ({holds.length})
          </button>
          <button
            onClick={() => setShowCloseShift(true)}
            className="text-sm font-semibold px-3.5 py-2.5 rounded-full border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300 touch-manipulation"
          >
            Close Shift
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[{ slug: '', name: 'All' }, ...categories].map((cat) => (
            <button
              key={cat.slug || 'all'}
              onClick={() => setCategory(cat.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                category === cat.slug
                  ? 'bg-wa-green text-white'
                  : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <LoadingBlock className="py-10" />
        ) : products.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No items found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setPendingProduct(p)}
                disabled={p.stock <= 0}
                className="text-left bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl overflow-hidden disabled:opacity-40 active:scale-[0.97] transition-transform touch-manipulation"
              >
                <img src={p.image} alt={p.name} className="w-full h-28 object-cover" loading="lazy" />
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {p.name}
                    {p.product_code && <span className="text-gray-400 font-normal"> ({p.product_code})</span>}
                  </p>
                  <p className="text-sm font-bold text-wa-green-dark dark:text-wa-green mt-1">
                    {formatPrice(Number(p.discount_percent) > 0 ? p.discount_price : p.sale_price)}
                  </p>
                  {p.stock <= 0 && <p className="text-[11px] text-red-500 font-semibold">Out of stock</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-96 shrink-0">
        <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 sticky top-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Current Order</h3>

          <div className="mb-3">
            {customer ? (
              <div className="flex items-center justify-between bg-wa-green/10 rounded-lg px-3 py-2">
                <span className="text-sm font-semibold text-wa-green-dark dark:text-wa-green">{customer.name}</span>
                <button onClick={() => setCustomer(null)} aria-label="Remove customer">
                  <FontAwesomeIcon icon={faXmark} className="text-gray-500" size="sm" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer (optional)..."
                  className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
                />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomer(c);
                          setCustomerSearch('');
                          setCustomerResults([]);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faUserPlus} className="text-gray-400" size="xs" />
                        {c.name} · {c.phone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No items yet. Tap an item to add it.</p>
          ) : (
            <div className="space-y-1 max-h-72 overflow-y-auto mb-3 -mx-1">
              {cart.map((item) => (
                <button
                  key={item.product_id}
                  onClick={() => setPendingProduct({ id: item.product_id, name: item.name, product_code: item.product_code, image: item.image, stock: item.stock, sale_price: item.price, discount_percent: 0 })}
                  className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/60 text-left touch-manipulation"
                >
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-neutral-800" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => decrementItem(item.product_id)}
                      className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 flex items-center justify-center touch-manipulation"
                      aria-label="Decrease quantity"
                    >
                      <FontAwesomeIcon icon={faMinus} size="xs" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => incrementItem(item.product_id)}
                      disabled={item.quantity >= item.stock}
                      className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 disabled:opacity-30 flex items-center justify-center touch-manipulation"
                      aria-label="Increase quantity"
                    >
                      <FontAwesomeIcon icon={faPlus} size="xs" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Discount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Tax %</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Service %</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2 space-y-1 text-sm mb-3">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Discount</span>
              <span>-{formatPrice(Number(discountAmount) || 0)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Service Charge ({Number(serviceChargePercent) || 0}%)</span>
              <span>{formatPrice(serviceAmount)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tax ({Number(taxPercent) || 0}%)</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 text-base pt-1">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleHold}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40 font-semibold px-3 py-2.5 rounded-lg text-sm"
            >
              <FontAwesomeIcon icon={faPause} size="xs" />
              Hold
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkingOut}
              className="flex-1 bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-sm"
            >
              {checkingOut ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>

      <QuantityPickerModal
        key={pendingProduct?.id ?? 'none'}
        product={pendingProduct}
        initialQuantity={pendingProduct ? cart.find((i) => i.product_id === pendingProduct.id)?.quantity || 1 : 1}
        onClose={() => setPendingProduct(null)}
        onConfirm={setCartQuantity}
      />
      <CloseShiftModal
        shift={shift}
        open={showCloseShift}
        onClose={() => setShowCloseShift(false)}
        onClosed={() => {
          setShowCloseShift(false);
          setShift(null);
        }}
      />
      <HeldOrdersModal
        open={showHolds}
        onClose={() => setShowHolds(false)}
        holds={holds}
        onResume={resumeHold}
        onDelete={deleteHold}
      />
    </div>
  );
}
