import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faMagnifyingGlass,
  faXmark,
  faTriangleExclamation,
  faTags,
  faCartShopping,
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import Pagination from '../components/Pagination';
import LoadingBlock from '../components/LoadingBlock';
import Toast from '../components/Toast';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../context/CurrencyContext';
import { fadeUpItem } from '../lib/motion';

const PAGE_SIZE = 10;
const CART_STORAGE_KEY = 'ccs_wholesale_cart';

const GLASS_CARD =
  'bg-white/60 dark:bg-neutral-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-none';

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function QuantityControl({ quantity, stock, onAdd, onIncrement, onDecrement, fullWidth }) {
  const outOfStock = stock <= 0;
  const atMax = quantity >= stock;

  if (quantity > 0) {
    return (
      <div className={`flex items-center gap-1.5 shrink-0 ${fullWidth ? 'w-full justify-between bg-white/50 dark:bg-neutral-800/50 rounded-lg py-1 px-1' : ''}`}>
        <motion.button
          onClick={onDecrement}
          whileTap={{ scale: 0.85 }}
          aria-label="Decrease quantity"
          className="w-8 h-8 rounded-lg bg-white/70 dark:bg-neutral-800/70 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
        >
          −
        </motion.button>
        <motion.span
          key={quantity}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          {quantity}
        </motion.span>
        <motion.button
          onClick={onIncrement}
          whileTap={{ scale: 0.85 }}
          disabled={atMax}
          aria-label="Increase quantity"
          title={atMax ? `Only ${stock} in stock` : undefined}
          className="w-8 h-8 rounded-lg bg-white/70 dark:bg-neutral-800/70 disabled:opacity-30 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
        >
          +
        </motion.button>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onAdd}
      whileTap={{ scale: 0.95 }}
      disabled={outOfStock}
      className={`shrink-0 bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full ${fullWidth ? 'w-full' : ''}`}
    >
      {outOfStock ? 'Out of stock' : 'Add'}
    </motion.button>
  );
}

function WholesaleRow({ product, formatPrice, quantity, onAdd, onIncrement, onDecrement }) {
  return (
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="show"
      className={`flex items-center gap-3 p-3 rounded-2xl ${GLASS_CARD}`}
    >
      <img
        src={product.image}
        alt={product.name}
        className="w-16 h-16 rounded-xl object-cover shrink-0 bg-white/50 dark:bg-neutral-800/50"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
          {product.name}
          {product.product_code && <span className="text-gray-400 font-normal"> ({product.product_code})</span>}
        </p>
        <span className="inline-block mt-1 text-sm font-bold text-wa-green-dark dark:text-wa-green bg-wa-green/10 dark:bg-wa-green/15 px-2.5 py-0.5 rounded-full">
          {formatPrice(product.purchase_price)}
        </span>
      </div>
      <QuantityControl quantity={quantity} stock={product.stock} onAdd={onAdd} onIncrement={onIncrement} onDecrement={onDecrement} />
    </motion.div>
  );
}

function WholesaleCard({ product, formatPrice, quantity, onAdd, onIncrement, onDecrement }) {
  return (
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="show"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`rounded-2xl flex flex-col overflow-hidden ${GLASS_CARD}`}
    >
      <img src={product.image} alt={product.name} className="w-full h-40 object-cover" loading="lazy" />
      <div className="p-3 flex flex-col flex-1">
        <p className="font-medium text-sm text-gray-800 dark:text-gray-100 line-clamp-2 flex-1">
          {product.name}
          {product.product_code && <span className="text-gray-400 font-normal"> ({product.product_code})</span>}
        </p>
        <span className="inline-block self-start mt-2 text-sm font-bold text-wa-green-dark dark:text-wa-green bg-wa-green/10 dark:bg-wa-green/15 px-2.5 py-0.5 rounded-full">
          {formatPrice(product.purchase_price)}
        </span>
        <div className="mt-3">
          <QuantityControl quantity={quantity} stock={product.stock} onAdd={onAdd} onIncrement={onIncrement} onDecrement={onDecrement} fullWidth />
        </div>
      </div>
    </motion.div>
  );
}

export default function WholesaleView() {
  const { token } = useParams();
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState(loadCart);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(() => {});
    api.get('/subcategories').then((res) => setSubcategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const params = { token };
    if (category) params.category = category;
    if (subcategory) params.subcategory = subcategory;
    if (search) params.search = search;
    api
      .get('/wholesale/products', { params })
      .then((res) => {
        setProducts(res.data);
        setInvalid(false);
      })
      .catch((err) => {
        if (err.response?.status === 403) setInvalid(true);
      })
      .finally(() => setLoading(false));
  }, [token, category, subcategory, search]);

  useEffect(() => {
    setPage(1);
  }, [category, subcategory, search]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  function showToast(type, message, duration = 4000) {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  }

  function cartQuantity(id) {
    return cart.find((i) => i.id === id)?.quantity || 0;
  }

  function addToCart(product) {
    const stock = Number(product.stock ?? Infinity);
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, stock, quantity: Math.min(i.quantity + 1, stock) } : i));
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          product_code: product.product_code || null,
          price: Number(product.purchase_price),
          image: product.image,
          stock,
          quantity: Math.min(1, stock),
        },
      ];
    });
  }

  function incrementItem(id, stock) {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(i.quantity + 1, Number(stock ?? i.stock ?? Infinity)) } : i))
    );
  }

  function decrementItem(id) {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity - 1 } : i));
    });
  }

  async function handleSendOrder() {
    setSending(true);
    try {
      const { data } = await api.post('/whatsapp/send', {
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        wholesaleToken: token,
      });
      setCart([]);
      if (data.whatsapp?.number) {
        // Same-tab navigation (not a pre-opened blank tab) so mobile Safari
        // doesn't strand the request on about:blank - see Cart.jsx for the
        // original rationale, this mirrors it exactly.
        const href = `https://wa.me/${data.whatsapp.number}?text=${encodeURIComponent(data.whatsapp.text)}`;
        window.location.href = href;
      } else {
        showToast('success', data.message || 'Order placed!');
      }
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to send order request');
    } finally {
      setSending(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  function selectCategory(slug) {
    setCategory(slug);
    setSubcategory('');
  }

  const allChip = { slug: '', name: 'All Products' };
  const chips = [allChip, ...categories];
  const activeCategorySubcategories = category
    ? subcategories.filter((sc) => sc.category_slug === category)
    : [];

  const backdrop =
    'min-h-screen bg-gradient-to-br from-wa-teal/15 via-white to-wa-green/10 dark:from-wa-teal/10 dark:via-black dark:to-wa-green/5 relative overflow-hidden';
  const blobs = (
    <>
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-wa-teal/20 dark:bg-wa-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-wa-green/20 dark:bg-wa-green/10 blur-3xl" />
    </>
  );

  if (invalid) {
    return (
      <div className={`${backdrop} flex items-center justify-center px-4`}>
        {blobs}
        <div className={`relative text-center max-w-sm rounded-3xl p-8 ${GLASS_CARD}`}>
          <div className="text-4xl mb-3 text-red-500">
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </div>
          <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Invalid or expired link</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This wholesale link is no longer valid. Please ask the store admin for the latest link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={backdrop}>
      {blobs}
      <div className={`relative max-w-6xl mx-auto px-4 py-6 lg:py-8 ${cartCount > 0 ? 'pb-28' : ''}`}>
        <div className="mb-5 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-wa-teal to-wa-green text-white shadow-lg overflow-hidden relative">
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-14 -left-6 w-32 h-32 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80 mb-1">
            <FontAwesomeIcon icon={faTags} />
            Wholesale Access
          </div>
          <h1 className="relative text-xl sm:text-2xl font-bold">{settings?.store_name || 'Soon'}</h1>
          <p className="relative text-sm text-white/85 mt-0.5">Prices shown below are cost price, not retail price.</p>
        </div>

        <div
          className={`flex items-center rounded-full mb-5 max-w-md transition-shadow focus-within:ring-2 focus-within:ring-wa-green ${GLASS_CARD}`}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 ml-4 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search for toys..."
            className="flex-1 min-w-0 bg-transparent px-3 py-2 text-base sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="Clear search"
              className="w-7 h-7 mr-2 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              <FontAwesomeIcon icon={faXmark} size="sm" />
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {chips.map((cat) => {
              const active = category === cat.slug;
              return (
                <motion.button
                  key={cat.slug || 'all'}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectCategory(cat.slug)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-wa-green text-white shadow'
                      : `${GLASS_CARD} text-gray-700 dark:text-gray-300`
                  }`}
                >
                  {cat.name}
                </motion.button>
              );
            })}
          </div>

          {activeCategorySubcategories.length > 0 && (
            <div className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {activeCategorySubcategories.map((sc) => {
                const active = subcategory === sc.slug;
                return (
                  <motion.button
                    key={sc.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSubcategory(active ? '' : sc.slug)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                      active
                        ? 'bg-wa-green-dark/10 border-wa-green text-wa-green-dark dark:text-wa-green'
                        : 'border-white/50 dark:border-white/10 bg-white/40 dark:bg-neutral-900/30 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {sc.name}
                  </motion.button>
                );
              })}
            </div>
          )}

          <aside className="hidden lg:block lg:w-64 shrink-0">
            <div className={`sticky top-6 rounded-2xl p-4 max-h-[calc(100vh-3rem)] overflow-y-auto ${GLASS_CARD}`}>
              <h3 className="flex items-center gap-2 font-bold mb-3 text-gray-900 dark:text-gray-100">
                <FontAwesomeIcon icon={faLayerGroup} className="text-wa-green-dark dark:text-wa-green" />
                Categories
              </h3>
              <ul className="space-y-1">
                {chips.map((cat) => {
                  const active = category === cat.slug;
                  return (
                    <li key={cat.slug || 'all'}>
                      <button
                        onClick={() => selectCategory(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                          active
                            ? 'bg-wa-green text-white font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                      {active && cat.slug && activeCategorySubcategories.length > 0 && (
                        <ul className="mt-1 ml-3 space-y-1 border-l border-white/50 dark:border-white/10 pl-3">
                          {activeCategorySubcategories.map((sc) => (
                            <li key={sc.id}>
                              <button
                                onClick={() => setSubcategory(sc.slug)}
                                className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors ${
                                  subcategory === sc.slug
                                    ? 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green font-semibold'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-white/5'
                                }`}
                              >
                                {sc.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>

          <div className="flex-1">
            {loading ? (
              <LoadingBlock className="py-6" />
            ) : products.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No products found.</p>
            ) : (
              <div key={`${category}-${subcategory}-${search}-${page}`}>
                <div className="md:hidden max-w-2xl space-y-3">
                  {pagedProducts.map((p) => (
                    <WholesaleRow
                      key={p.id}
                      product={p}
                      formatPrice={formatPrice}
                      quantity={cartQuantity(p.id)}
                      onAdd={() => addToCart(p)}
                      onIncrement={() => incrementItem(p.id, p.stock)}
                      onDecrement={() => decrementItem(p.id)}
                    />
                  ))}
                </div>
                <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {pagedProducts.map((p) => (
                    <WholesaleCard
                      key={p.id}
                      product={p}
                      formatPrice={formatPrice}
                      quantity={cartQuantity(p.id)}
                      onAdd={() => addToCart(p)}
                      onIncrement={() => incrementItem(p.id, p.stock)}
                      onDecrement={() => decrementItem(p.id)}
                    />
                  ))}
                </div>
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {cartCount > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-t border-white/60 dark:border-white/10 px-4 py-3"
            >
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{cartCount} item{cartCount !== 1 ? 's' : ''} · Cost price total</p>
                  <motion.p
                    key={cartTotal}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="font-bold text-lg text-gray-900 dark:text-gray-100"
                  >
                    {formatPrice(cartTotal)}
                  </motion.p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendOrder}
                  disabled={sending}
                  className="flex-1 max-w-[240px] bg-wa-green hover:bg-wa-green-dark disabled:opacity-60 text-white font-bold py-3 rounded-full flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCartShopping} />
                  {sending ? 'Sending...' : 'Send order request'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <Toast toast={toast} />
    </div>
  );
}
