import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  faKeyboard,
  faChevronLeft,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import LoadingBlock from '../../components/LoadingBlock';
import OnScreenKeyboard from '../../components/OnScreenKeyboard';
import NumPad from '../../components/NumPad';
import ReceiptModal from '../../components/pos/ReceiptModal';
import Toast from '../../components/Toast';
import Spinner from '../../components/Spinner';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../context/CurrencyContext';
import { confirmAction, successAlert, errorAlert } from '../../lib/alert';
import { buildReceiptHtml } from '../../lib/receiptTemplate';
import { getPosProductsCache, setPosProductsCache, getPosCategoriesCache, setPosCategoriesCache } from '../../lib/posCache';
import { posUnitPrice } from '../../lib/posPrice';

function OpenShiftScreen({ onOpened, isDesktop }) {
  const [openingCash, setOpeningCash] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [numPadOpen, setNumPadOpen] = useState(false);

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
            type="text"
            inputMode={isDesktop ? 'none' : 'decimal'}
            readOnly={isDesktop}
            required
            placeholder="Opening cash amount"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            onFocus={() => {
              if (isDesktop) setNumPadOpen(true);
            }}
            className={`w-full border rounded-lg px-3 py-2 text-center text-base dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
              numPadOpen ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
            }`}
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
      {isDesktop && numPadOpen && (
        <NumPad
          value={openingCash}
          onChange={setOpeningCash}
          onEnter={() => setNumPadOpen(false)}
          onClose={() => setNumPadOpen(false)}
        />
      )}
    </div>
  );
}

function CloseShiftModal({ shift, open, isDesktop, onClose, onClosed }) {
  const { formatPrice } = useCurrency();
  const [closingCash, setClosingCash] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [numPadOpen, setNumPadOpen] = useState(false);

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
    setNumPadOpen(false);
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
          {result.cash_out_total > 0 && (
            <p className="text-gray-700 dark:text-gray-300">
              Cash Out: <span className="font-semibold">-{formatPrice(result.cash_out_total)}</span>
            </p>
          )}
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
            type="text"
            inputMode={isDesktop ? 'none' : 'decimal'}
            readOnly={isDesktop}
            required
            placeholder="Counted cash amount"
            value={closingCash}
            onChange={(e) => setClosingCash(e.target.value)}
            onFocus={() => {
              if (isDesktop) setNumPadOpen(true);
            }}
            className={`w-full border rounded-lg px-3 py-2 text-base dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
              numPadOpen ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
            }`}
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
      {isDesktop && numPadOpen && !result && (
        <NumPad
          value={closingCash}
          onChange={setClosingCash}
          onEnter={() => setNumPadOpen(false)}
          onClose={() => setNumPadOpen(false)}
        />
      )}
    </Modal>
  );
}

const CASH_OUT_REASONS = ['Salary', 'Delivery', 'Collection', 'Lunch', 'Other'];

function OutCashModal({ shift, open, isDesktop, onClose, onDone }) {
  const [reason, setReason] = useState('Salary');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [numPadOpen, setNumPadOpen] = useState(false);
  const [noteKeyboardOpen, setNoteKeyboardOpen] = useState(false);

  function reset() {
    setReason('Salary');
    setNote('');
    setAmount('');
    setError('');
    setNumPadOpen(false);
    setNoteKeyboardOpen(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (reason === 'Other' && !note.trim()) {
      setError('Enter a note for "Other"');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post(`/pos/shifts/${shift.id}/cash-out`, {
        amount: amount || 0,
        reason,
        note: note.trim() || undefined,
      });
      reset();
      onDone(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record cash out');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Out Cash"
    >
      <div className={isDesktop ? 'max-h-[calc(100vh_-_27rem)] overflow-y-auto' : ''}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <p className="text-sm text-gray-500 dark:text-gray-400">Take cash out of the till for an expense.</p>
          <div className="grid grid-cols-3 gap-2">
            {CASH_OUT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-sm font-semibold py-2.5 rounded-lg border touch-manipulation ${
                  reason === r
                    ? 'bg-wa-green text-white border-wa-green'
                    : 'border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            inputMode={isDesktop ? 'none' : 'text'}
            readOnly={isDesktop}
            required={reason === 'Other'}
            placeholder={reason === 'Other' ? 'Reason detail (required)' : 'Note (optional)'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onFocus={() => {
              if (isDesktop) {
                setNumPadOpen(false);
                setNoteKeyboardOpen(true);
              }
            }}
            className={`w-full border rounded-lg px-3 py-2 text-base dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
              noteKeyboardOpen ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
            }`}
          />
          <input
            type="text"
            inputMode={isDesktop ? 'none' : 'decimal'}
            readOnly={isDesktop}
            required
            placeholder="Amount to take out"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onFocus={() => {
              if (isDesktop) {
                setNoteKeyboardOpen(false);
                setNumPadOpen(true);
              }
            }}
            className={`w-full border rounded-lg px-3 py-2 text-base dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
              numPadOpen ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
            }`}
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? 'Recording...' : 'Take Out'}
          </button>
        </form>
      </div>
      {isDesktop && numPadOpen && (
        <NumPad
          value={amount}
          onChange={setAmount}
          onEnter={() => setNumPadOpen(false)}
          onClose={() => setNumPadOpen(false)}
        />
      )}
      {isDesktop && noteKeyboardOpen && (
        <OnScreenKeyboard
          value={note}
          onChange={setNote}
          onEnter={() => setNoteKeyboardOpen(false)}
          onClose={() => setNoteKeyboardOpen(false)}
        />
      )}
    </Modal>
  );
}

function QuantityPickerModal({ product, initialQuantity, priceMode = 'sale', useOnScreenPad = true, onClose, onConfirm }) {
  const { formatPrice } = useCurrency();
  const [quantity, setQuantity] = useState(initialQuantity);

  useEffect(() => {
    setQuantity(initialQuantity);
  }, [product?.id, initialQuantity]);

  if (!product) return null;
  const unitPrice = posUnitPrice(product, priceMode);
  const atMax = quantity >= product.stock;

  function clampQuantity(raw) {
    const digits = String(raw ?? '').replace(/\D/g, '');
    if (digits === '') return '';
    const n = Math.floor(Number(digits));
    if (!Number.isFinite(n)) return '';
    return Math.min(product.stock || 1, n);
  }

  function commitQuantity() {
    const n = Number(quantity);
    return Number.isFinite(n) && n >= 1 ? Math.min(product.stock || 1, n) : 1;
  }

  return (
    <Modal open={!!product} onClose={onClose} title="Add to Order" align="start">
      <div className={useOnScreenPad ? 'max-h-[calc(100vh_-_27rem)] overflow-y-auto' : ''}>
        <div className="flex items-center gap-3 mb-4">
          <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-gray-100 dark:bg-neutral-800" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
            <p className="text-wa-green-dark dark:text-wa-green font-bold">{formatPrice(unitPrice)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(product, commitQuantity())}
          className="w-full bg-wa-green hover:bg-wa-green-dark active:bg-wa-green-dark text-white font-bold py-3.5 rounded-xl text-base mb-3"
        >
          Add {commitQuantity()} to Order · {formatPrice(unitPrice * commitQuantity())}
        </button>

        <div className="flex items-center justify-center gap-3 mb-2">
          {!useOnScreenPad && (
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center touch-manipulation"
              aria-label="Decrease quantity"
            >
              <FontAwesomeIcon icon={faMinus} />
            </button>
          )}
          {useOnScreenPad ? (
            <span className="min-w-[4rem] text-center text-3xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-neutral-700 pb-1 px-2">
              {quantity}
            </span>
          ) : (
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={product.stock || 1}
              value={quantity}
              onChange={(e) => setQuantity(clampQuantity(e.target.value))}
              className="w-20 text-center text-3xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-neutral-700 bg-transparent pb-1 focus:outline-none focus:border-wa-green"
            />
          )}
          {!useOnScreenPad && (
            <button
              type="button"
              onClick={() => setQuantity((q) => clampQuantity(q + 1))}
              disabled={atMax}
              className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-neutral-800 disabled:opacity-30 flex items-center justify-center touch-manipulation"
              aria-label="Increase quantity"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
        </div>
        {atMax && <p className="text-center text-xs text-red-500 mb-3">Only {product.stock} in stock</p>}
      </div>

      {useOnScreenPad && (
        <NumPad
          value={String(quantity)}
          onChange={(val) => setQuantity(clampQuantity(val))}
          onEnter={() => onConfirm(product, commitQuantity())}
          onClose={onClose}
        />
      )}
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
  const [showOutCash, setShowOutCash] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoryLetter, setCategoryLetter] = useState('');
  const [priceRange, setPriceRange] = useState('');
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
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentWay, setPaymentWay] = useState('full');
  const [amountPaid, setAmountPaid] = useState('');
  const [numPadField, setNumPadField] = useState(null);

  const [holds, setHolds] = useState([]);
  const [showHolds, setShowHolds] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [searchKeyboardOpen, setSearchKeyboardOpen] = useState(false);
  const [customerKeyboardOpen, setCustomerKeyboardOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);
  const [lookingUpCode, setLookingUpCode] = useState(false);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const pageSize = isDesktop ? 10 : 12;
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState(null);
  const priceMode = settings?.pos_display_price === 'cost' ? 'cost' : 'sale';
  const productScrollRef = useRef(null);

  function showToast(type, message, duration = 2500) {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  }

  function handleLoadMore() {
    if (loadingMore) return;
    const prevCount = visibleCount;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((c) => c + pageSize);
      setLoadingMore(false);
      // Keep 1–prevCount in the list; scroll so the newly added batch is in view.
      // User can scroll up to see earlier products again.
      requestAnimationFrame(() => {
        const scroller = productScrollRef.current;
        if (!scroller) return;
        const firstNew = scroller.querySelector(`[data-product-index="${prevCount}"]`);
        if (firstNew) {
          firstNew.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }, 350);
  }

  function loadShift() {
    api.get('/pos/shifts/current').then((res) => setShift(res.data));
  }

  useEffect(loadShift, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      setIsDesktop(mq.matches);
      if (mq.matches) setMobileOrderOpen(false);
      else {
        setSearchKeyboardOpen(false);
        setCustomerKeyboardOpen(false);
        setNumPadField(null);
      }
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isDesktop || !mobileOrderOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDesktop, mobileOrderOpen]);

  useEffect(() => {
    if (!shift) return;
    const cached = getPosCategoriesCache();
    if (cached) setCategories(cached);
    api.get('/categories').then((res) => {
      setCategories(res.data);
      setPosCategoriesCache(res.data);
    }).catch(() => {});
    refreshHolds();
  }, [shift]);

  useEffect(() => {
    if (settings) {
      setTaxPercent(String(settings.pos_tax_percent ?? 0));
      setServiceChargePercent(String(settings.pos_service_charge_percent ?? 0));
    }
  }, [settings]);

  useEffect(() => {
    setCart((prev) =>
      prev.map((item) => {
        const product = products.find((p) => p.id === item.product_id);
        if (!product) return item;
        return { ...item, price: posUnitPrice(product, priceMode) };
      })
    );
  }, [priceMode]);

  function loadProducts() {
    if (!shift) return;
    const cached = getPosProductsCache(search);
    if (cached) {
      setProducts(cached);
      setLoadingProducts(false);
    } else {
      setLoadingProducts(true);
    }
    const params = {};
    if (search) params.search = search;
    api
      .get('/products', { params })
      .then((res) => {
        setProducts(res.data);
        setPosProductsCache(search, res.data);
      })
      .catch((err) => {
        if (!cached) errorAlert('Failed to load products', err.response?.data?.message || 'Please try again.');
      })
      .finally(() => setLoadingProducts(false));
  }

  useEffect(loadProducts, [shift, search]);

  const availableLetters = useMemo(
    () => new Set(categories.map((c) => c.name?.[0]?.toUpperCase()).filter(Boolean)),
    [categories]
  );

  const PRICE_RANGES = {
    '0-100': [0, 100],
    '100-500': [100, 500],
    '500-1000': [500, 1000],
    '1000-2000': [1000, 2000],
    '2000-5000': [2000, 5000],
    '5000+': [5000, Infinity],
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryLetter && !(p.category_name || '').toUpperCase().startsWith(categoryLetter)) return false;
      if (priceRange) {
        const price = posUnitPrice(p, priceMode);
        const [min, max] = PRICE_RANGES[priceRange];
        if (price < min || price > max) return false;
      }
      return true;
    });
  }, [products, categoryLetter, priceRange, priceMode]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [search, categoryLetter, priceRange, pageSize]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

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

  // Barcode-scanner-style flow: type/scan a product code into the search bar
  // and hit Enter (physical or the on-screen keyboard's Enter key) to jump
  // straight to the quantity popup, same as tapping a product tile.
  async function handleCodeLookup(rawCode) {
    const code = rawCode.trim();
    if (!code || lookingUpCode) return;

    const matchesCode = (p) => p.product_code && p.product_code.toLowerCase() === code.toLowerCase();
    const localMatch = products.find(matchesCode);
    if (localMatch) {
      if (localMatch.stock <= 0) {
        errorAlert('Out of stock', `${localMatch.name} has no stock available.`);
        return;
      }
      setPendingProduct(localMatch);
      setSearchInput('');
      setSearchKeyboardOpen(false);
      return;
    }

    setLookingUpCode(true);
    try {
      const { data } = await api.get('/products', { params: { search: code } });
      const match = data.find(matchesCode);
      if (!match) {
        errorAlert('Product not found', `No product with code "${code}".`);
        return;
      }
      if (match.stock <= 0) {
        errorAlert('Out of stock', `${match.name} has no stock available.`);
        return;
      }
      setPendingProduct(match);
      setSearchInput('');
      setSearchKeyboardOpen(false);
    } finally {
      setLookingUpCode(false);
    }
  }

  // Tapping a product opens the quantity-picker popup instead of adding
  // straight to the cart - this upserts the exact quantity chosen there
  // (as opposed to incrementItem/decrementItem below, which just nudge an
  // already-in-cart line by one from the Current Order panel).
  function setCartQuantity(product, quantity) {
    const unitPrice = posUnitPrice(product, priceMode);
    const existing = cart.find((i) => i.product_id === product.id);
    setCart((prev) => {
      const found = prev.find((i) => i.product_id === product.id);
      if (found) {
        return prev.map((i) => (i.product_id === product.id ? { ...i, quantity, price: unitPrice } : i));
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
    showToast('success', existing ? `Updated ${product.name} × ${quantity}` : `Added ${product.name} × ${quantity}`);
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

  async function removeItem(productId) {
    const item = cart.find((i) => i.product_id === productId);
    if (!item) return;
    const confirmed = await confirmAction({
      title: 'Remove item?',
      text: `Remove ${item.name} from the current order?`,
      confirmText: 'Remove',
    });
    if (!confirmed) return;
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function resetCart() {
    setCart([]);
    setCustomer(null);
    setCustomerSearch('');
    setCustomerKeyboardOpen(false);
    setDiscountAmount('0');
    setTaxPercent(String(settings?.pos_tax_percent ?? 0));
    setServiceChargePercent(String(settings?.pos_service_charge_percent ?? 0));
    setPaymentMethod('cash');
    setPaymentWay('full');
    setAmountPaid('');
    setNumPadField(null);
  }

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const afterDiscount = Math.max(0, subtotal - (Number(discountAmount) || 0));
  const taxAmount = afterDiscount * ((Number(taxPercent) || 0) / 100);
  const serviceAmount = afterDiscount * ((Number(serviceChargePercent) || 0) / 100);
  const total = afterDiscount + taxAmount + serviceAmount;
  const enteredAmount = Number(amountPaid) || 0;
  const amountPaidValue = paymentWay === 'advance' ? Math.min(enteredAmount, total) : total;
  const balanceDue = paymentWay === 'advance' ? Math.max(0, total - amountPaidValue) : 0;
  const changeDue = paymentWay === 'full' && enteredAmount > total ? enteredAmount - total : 0;
  const insufficientFull = paymentWay === 'full' && enteredAmount > 0 && enteredAmount < total;

  const NUM_PAD_FIELDS = {
    discount: { value: discountAmount, set: setDiscountAmount },
    tax: { value: taxPercent, set: setTaxPercent },
    service: { value: serviceChargePercent, set: setServiceChargePercent },
    payment: { value: amountPaid, set: setAmountPaid },
  };

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
    if (cart.length === 0 || insufficientFull) return;
    const confirmed = await confirmAction({
      title: 'Complete this sale?',
      text:
        balanceDue > 0
          ? `Total: ${formatPrice(total)}\nAdvance paid: ${formatPrice(amountPaidValue)}\nBalance due: ${formatPrice(balanceDue)}`
          : changeDue > 0
          ? `Total: ${formatPrice(total)}\nAmount tendered: ${formatPrice(enteredAmount)}\nChange due: ${formatPrice(changeDue)}`
          : `Total: ${formatPrice(total)}`,
      confirmText: 'Complete Sale',
    });
    if (!confirmed) return;

    setCheckingOut(true);
    try {
      const { data } = await api.post('/pos/sales', {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        customer_id: customer?.id || null,
        discount_amount: Number(discountAmount) || 0,
        tax_percent: Number(taxPercent) || 0,
        service_charge_percent: Number(serviceChargePercent) || 0,
        payment_method: paymentMethod,
        amount_paid: amountPaidValue,
      });
      resetCart();
      loadProducts();
      setReceiptSale(data);
    } catch (err) {
      errorAlert('Sale failed', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setCheckingOut(false);
    }
  }

  if (shift === undefined) return <LoadingBlock className="py-16" />;
  if (!shift) return <OpenShiftScreen onOpened={setShift} isDesktop={isDesktop} />;

  return (
    <div
      className={`h-full max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0 overflow-hidden ${
        mobileOrderOpen && !isDesktop ? 'overflow-hidden' : ''
      }`}
    >
      <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 shrink-0">
          <div className="flex items-center rounded-full flex-1 min-w-0 sm:max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 ml-2.5 sm:ml-4 shrink-0 text-xs sm:text-sm" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCodeLookup(searchInput);
              }}
              onFocus={() => {
                if (isDesktop) setSearchKeyboardOpen(true);
              }}
              placeholder="Search or scan code..."
              className="flex-1 min-w-0 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-base sm:text-sm text-gray-800 dark:text-gray-100 focus:outline-none placeholder:text-sm"
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} className="w-7 h-7 sm:w-9 sm:h-9 mr-0.5 sm:mr-1 text-gray-400 touch-manipulation" aria-label="Clear search">
                <FontAwesomeIcon icon={faXmark} size="sm" />
              </button>
            )}
            <button
              onClick={() => setSearchKeyboardOpen((v) => !v)}
              className={`hidden lg:flex w-9 h-9 mr-1 rounded-full items-center justify-center touch-manipulation ${
                searchKeyboardOpen ? 'text-wa-green-dark dark:text-wa-green' : 'text-gray-400'
              }`}
              aria-label="Toggle on-screen keyboard"
            >
              <FontAwesomeIcon icon={faKeyboard} size="sm" />
            </button>
          </div>
          <button
            onClick={() => setShowHolds(true)}
            className="shrink-0 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 touch-manipulation"
          >
            <FontAwesomeIcon icon={faClockRotateLeft} />
            <span className="hidden sm:inline">Held</span>
            <span>({holds.length})</span>
          </button>
          <button
            onClick={() => setShowOutCash(true)}
            className="shrink-0 text-xs sm:text-sm font-semibold px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300 touch-manipulation whitespace-nowrap"
          >
            Out Cash
          </button>
          <button
            onClick={() => setShowCloseShift(true)}
            className="shrink-0 text-xs sm:text-sm font-semibold px-2 sm:px-3.5 py-1.5 sm:py-2.5 rounded-full border border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300 touch-manipulation whitespace-nowrap"
          >
            <span className="sm:hidden">Close</span>
            <span className="hidden sm:inline">Close Shift</span>
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setCategoryLetter('')}
            className={`shrink-0 w-9 h-9 rounded-full text-xs font-bold touch-manipulation ${
              categoryLetter === ''
                ? 'bg-wa-green text-white'
                : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
            const disabled = !availableLetters.has(letter);
            return (
              <button
                key={letter}
                onClick={() => setCategoryLetter(letter)}
                disabled={disabled}
                className={`shrink-0 w-9 h-9 rounded-full text-xs font-bold touch-manipulation disabled:opacity-25 ${
                  categoryLetter === letter
                    ? 'bg-wa-green text-white'
                    : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setPriceRange('')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
              priceRange === ''
                ? 'bg-wa-green text-white'
                : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Prices
          </button>
          {Object.keys(PRICE_RANGES).map((key) => (
            <button
              key={key}
              onClick={() => setPriceRange(key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation ${
                priceRange === key
                  ? 'bg-wa-green text-white'
                  : 'bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          {loadingProducts ? (
            <LoadingBlock className="py-10" />
          ) : filteredProducts.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm p-4">No items found.</p>
          ) : (
            <>
              <div ref={productScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                  {visibleProducts.map((p, index) => {
                    const cartQuantity = cart.find((i) => i.product_id === p.id)?.quantity || 0;
                    return (
                    <button
                      key={p.id}
                      data-product-index={index}
                      onClick={() => setPendingProduct(p)}
                      disabled={p.stock <= 0}
                      className="relative text-left bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-xl sm:rounded-2xl overflow-hidden disabled:opacity-40 active:scale-[0.97] transition-transform touch-manipulation"
                    >
                      {cartQuantity > 0 && (
                        <span className="absolute top-1 right-1 z-10 min-w-[1.25rem] h-5 px-1 rounded-full bg-wa-green text-white text-[10px] font-bold flex items-center justify-center shadow">
                          {cartQuantity}
                        </span>
                      )}
                      <img src={p.image} alt={p.name} className="w-full h-16 sm:h-28 object-cover" loading="lazy" />
                      <div className="p-1.5 sm:p-2.5">
                        <p className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                          {p.name}
                          {p.product_code && <span className="text-gray-400 font-normal"> ({p.product_code})</span>}
                        </p>
                        <p className="text-xs sm:text-sm font-bold text-wa-green-dark dark:text-wa-green mt-0.5 sm:mt-1">
                          {formatPrice(posUnitPrice(p, priceMode))}
                        </p>
                        {p.stock > 0 ? (
                          <p className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500">Stock: {p.stock}</p>
                        ) : (
                          <p className="text-[9px] sm:text-[11px] text-red-500 font-semibold">Out of stock</p>
                        )}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
              {hasMore && (
                <div className="shrink-0 border-t border-gray-200 dark:border-neutral-800 p-2.5 sm:p-3 bg-white dark:bg-neutral-900">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full py-3 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-70 touch-manipulation flex items-center justify-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <Spinner size="sm" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <motion.div
        id="current-order"
        initial={false}
        animate={{ x: isDesktop || mobileOrderOpen ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        aria-hidden={!isDesktop && !mobileOrderOpen}
        className={
          isDesktop
            ? 'w-full lg:w-96 shrink-0 scroll-mt-4 lg:h-full lg:min-h-0'
            : `fixed inset-0 z-40 overflow-y-auto px-4 py-4 bg-gray-50 dark:bg-neutral-950 ${
                mobileOrderOpen ? '' : 'pointer-events-none'
              }`
        }
      >
        <div
          className={`bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 ${
            isDesktop ? 'lg:h-full lg:overflow-y-auto' : ''
          }`}
        >
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
                  onFocus={() => {
                    if (isDesktop) setCustomerKeyboardOpen(true);
                  }}
                  placeholder="Search customer (optional)..."
                  className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-base sm:text-sm"
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
                          setCustomerKeyboardOpen(false);
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
            <div className="space-y-1 max-h-28 overflow-y-auto mb-3 -mx-1">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setPendingProduct({ id: item.product_id, name: item.name, product_code: item.product_code, image: item.image, stock: item.stock, sale_price: item.price, discount_percent: 0 })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setPendingProduct({ id: item.product_id, name: item.name, product_code: item.product_code, image: item.image, stock: item.stock, sale_price: item.price, discount_percent: 0 });
                    }
                  }}
                  className="w-full flex items-center gap-2 px-1 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800/60 text-left touch-manipulation cursor-pointer"
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
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 active:bg-red-100 dark:active:bg-red-900/50 flex items-center justify-center touch-manipulation"
                      aria-label="Remove item"
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Discount</label>
              <input
                type="text"
                inputMode={isDesktop ? 'none' : 'decimal'}
                readOnly={isDesktop}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                onFocus={() => {
                  if (isDesktop) setNumPadField('discount');
                }}
                className={`w-full border rounded-md px-2 py-1.5 text-base sm:text-xs dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
                  numPadField === 'discount' ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Tax %</label>
              <input
                type="text"
                inputMode={isDesktop ? 'none' : 'decimal'}
                readOnly={isDesktop}
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                onFocus={() => {
                  if (isDesktop) setNumPadField('tax');
                }}
                className={`w-full border rounded-md px-2 py-1.5 text-base sm:text-xs dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
                  numPadField === 'tax' ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Service %</label>
              <input
                type="text"
                inputMode={isDesktop ? 'none' : 'decimal'}
                readOnly={isDesktop}
                value={serviceChargePercent}
                onChange={(e) => setServiceChargePercent(e.target.value)}
                onFocus={() => {
                  if (isDesktop) setNumPadField('service');
                }}
                className={`w-full border rounded-md px-2 py-1.5 text-base sm:text-xs dark:bg-neutral-800 dark:text-gray-100 touch-manipulation ${
                  numPadField === 'service' ? 'border-wa-green' : 'border-gray-300 dark:border-neutral-700'
                }`}
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

          <div className="border-t border-gray-100 dark:border-neutral-800 pt-2 mb-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Payment Method</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {['cash', 'card', 'cheque'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`capitalize text-xs font-semibold py-2 rounded-lg border touch-manipulation ${
                    paymentMethod === m
                      ? 'bg-wa-green text-white border-wa-green'
                      : 'border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">Payment Way</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {[
                { key: 'full', label: 'Full Payment' },
                { key: 'advance', label: 'Advance Payment' },
              ].map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => {
                    setPaymentWay(w.key);
                    setAmountPaid('');
                    setNumPadField(null);
                  }}
                  className={`text-xs font-semibold py-2 rounded-lg border touch-manipulation ${
                    paymentWay === w.key
                      ? 'bg-wa-green text-white border-wa-green'
                      : 'border-gray-300 dark:border-neutral-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-neutral-800/60 rounded-lg p-2.5">
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                {paymentWay === 'advance' ? 'Amount Paid Now' : 'Amount Tendered (optional)'}
              </span>
              {isDesktop ? (
                <button
                  type="button"
                  onClick={() => setNumPadField('payment')}
                  className={`w-full text-center text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 pb-1 mb-1 touch-manipulation ${
                    numPadField === 'payment' ? 'border-wa-green' : 'border-gray-200 dark:border-neutral-700'
                  }`}
                >
                  {enteredAmount > 0 ? formatPrice(enteredAmount) : paymentWay === 'advance' ? formatPrice(0) : 'Tap to enter amount given'}
                </button>
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={paymentWay === 'advance' ? '0' : 'Amount given'}
                  className="w-full text-center text-base sm:text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-neutral-700 bg-transparent pb-1 mb-1 focus:outline-none focus:border-wa-green"
                />
              )}
              {paymentWay === 'advance' && balanceDue > 0 && (
                <p className="text-center text-xs text-red-500">Balance due: {formatPrice(balanceDue)}</p>
              )}
              {paymentWay === 'full' && changeDue > 0 && (
                <p className="text-center text-xs font-semibold text-wa-green-dark dark:text-wa-green">
                  Change due: {formatPrice(changeDue)}
                </p>
              )}
              {insufficientFull && (
                <p className="text-center text-xs text-red-500">
                  Amount given is less than the total. Switch to Advance Payment to record it as a partial payment.
                </p>
              )}
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
              disabled={cart.length === 0 || checkingOut || insufficientFull}
              className="flex-1 bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-sm"
            >
              {checkingOut ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      </motion.div>

      <QuantityPickerModal
        key={pendingProduct?.id ?? 'none'}
        product={pendingProduct}
        initialQuantity={pendingProduct ? cart.find((i) => i.product_id === pendingProduct.id)?.quantity || 1 : 1}
        priceMode={priceMode}
        useOnScreenPad={isDesktop}
        onClose={() => setPendingProduct(null)}
        onConfirm={setCartQuantity}
      />
      <CloseShiftModal
        shift={shift}
        open={showCloseShift}
        isDesktop={isDesktop}
        onClose={() => setShowCloseShift(false)}
        onClosed={() => {
          setShowCloseShift(false);
          setShift(null);
        }}
      />
      <OutCashModal
        shift={shift}
        open={showOutCash}
        isDesktop={isDesktop}
        onClose={() => setShowOutCash(false)}
        onDone={(movement) => {
          setShowOutCash(false);
          showToast('success', `${formatPrice(movement.amount)} taken out for ${movement.reason}`, 3000);
        }}
      />
      <HeldOrdersModal
        open={showHolds}
        onClose={() => setShowHolds(false)}
        holds={holds}
        onResume={resumeHold}
        onDelete={deleteHold}
      />
      <ReceiptModal
        open={!!receiptSale}
        onClose={() => setReceiptSale(null)}
        title="Sale Complete"
        html={receiptSale ? buildReceiptHtml({ sale: receiptSale, settings, formatPrice }) : ''}
      />
      {isDesktop && searchKeyboardOpen && (
        <OnScreenKeyboard
          value={searchInput}
          onChange={setSearchInput}
          onEnter={() => handleCodeLookup(searchInput)}
          onClose={() => setSearchKeyboardOpen(false)}
        />
      )}
      {isDesktop && customerKeyboardOpen && (
        <OnScreenKeyboard
          value={customerSearch}
          onChange={setCustomerSearch}
          onEnter={() => setCustomerKeyboardOpen(false)}
          onClose={() => setCustomerKeyboardOpen(false)}
        />
      )}
      {isDesktop && numPadField && (
        <NumPad
          value={NUM_PAD_FIELDS[numPadField].value}
          onChange={NUM_PAD_FIELDS[numPadField].set}
          onEnter={() => setNumPadField(null)}
          onClose={() => setNumPadField(null)}
        />
      )}
      {!mobileOrderOpen && (
        <button
          type="button"
          onClick={() => setMobileOrderOpen(true)}
          aria-label="Open Current Order"
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-wa-green text-white rounded-l-xl shadow-lg px-1.5 py-3 flex flex-col items-center gap-0.5 touch-manipulation"
        >
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-wa-green-dark text-[10px] font-bold flex items-center justify-center mb-1">
              {cart.length}
            </span>
          )}
          {'CURRENT'.split('').map((ch, i) => (
            <span key={i} className="text-[10px] font-bold leading-none">
              {ch}
            </span>
          ))}
          <FontAwesomeIcon icon={faChevronLeft} className="text-[10px] mt-1" />
        </button>
      )}
      {mobileOrderOpen && (
        <button
          type="button"
          onClick={() => setMobileOrderOpen(false)}
          aria-label="Back to products"
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-wa-green text-white rounded-r-xl shadow-lg px-2 py-4 flex flex-col items-center gap-1 touch-manipulation"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
          {'BACK'.split('').map((ch, i) => (
            <span key={i} className="text-[10px] font-bold leading-none">
              {ch}
            </span>
          ))}
        </button>
      )}
      <Toast toast={toast} />
    </div>
  );
}
