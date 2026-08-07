import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';
import Toast from '../components/Toast';
import Modal from '../components/Modal';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [showGuestModal, setShowGuestModal] = useState(false);

  function showToast(type, message, duration = 4000) {
    setToast({ type, message });
    setTimeout(() => setToast(null), duration);
  }

  function handleRemove(item) {
    removeFromCart(item.id);
    showToast('success', `${item.name} removed from cart`, 3000);
  }

  function handleSendOrderRequest() {
    if (!user) {
      setShowGuestModal(true);
      return;
    }
    submitOrderRequest();
  }

  function continueWithLogin() {
    setShowGuestModal(false);
    navigate('/login');
  }

  function continueWithoutLogin() {
    setShowGuestModal(false);
    submitOrderRequest();
  }

  async function submitOrderRequest() {
    setSending(true);
    try {
      const { data } = await api.post('/whatsapp/send', {
        items: items.map((i) => ({
          product_id: i.id,
          quantity: i.quantity,
        })),
      });
      clearCart();
      if (data.whatsapp?.number) {
        // Navigate the current tab rather than pre-opening a blank one and
        // redirecting it later - on mobile browsers (notably iOS Safari)
        // that pattern leaves the new tab stuck on about:blank because the
        // window handle can't be navigated after the async request resolves.
        // A same-tab location change isn't subject to popup blocking at all.
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

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-gray-100">Your cart is empty</h2>
        <Link to="/products" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
          Continue Shopping
        </Link>
        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <div className="flex items-center px-4 pt-4 pb-2 relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-900 dark:text-gray-100 text-lg"
        >
          <FontAwesomeIcon icon={faXmark} />
        </motion.button>
        <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-lg text-gray-900 dark:text-gray-100">
          Your order request
        </h1>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          {items.reduce((s, i) => s + i.quantity, 0)} items
        </h2>
        <Link to="/products" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
          Add more
        </Link>
      </div>

      <div className="px-4 divide-y divide-gray-100 dark:divide-neutral-800">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -40, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 py-3"
            >
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-neutral-800" />
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.slug}`} className="font-semibold text-sm text-gray-900 dark:text-gray-100 hover:text-wa-green line-clamp-1">
                  {item.name}
                  {item.product_code && <span className="text-gray-400 font-normal"> ({item.product_code})</span>}
                </Link>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <motion.button
                    onClick={() => (item.quantity <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1))}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
                  >
                    −
                  </motion.button>
                  <motion.span
                    key={item.quantity}
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
                  >
                    {item.quantity}
                  </motion.span>
                  <motion.button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    whileTap={{ scale: 0.85 }}
                    disabled={item.stock !== undefined && item.quantity >= item.stock}
                    aria-label="Increase quantity"
                    title={item.stock !== undefined && item.quantity >= item.stock ? `Only ${item.stock} in stock` : undefined}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
                  >
                    +
                  </motion.button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  {formatPrice(item.price * item.quantity)}
                </p>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => handleRemove(item)}
                  aria-label="Remove item"
                  title="Remove item"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <FontAwesomeIcon icon={faTrash} size="xs" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {createPortal(
        <div className="fixed bottom-14 lg:bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Subtotal</p>
              <motion.p
                key={total}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className="font-bold text-lg text-gray-900 dark:text-gray-100"
              >
                {formatPrice(total)}
              </motion.p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSendOrderRequest}
              disabled={sending}
              className="flex-1 max-w-[220px] bg-wa-green hover:bg-wa-green-dark disabled:opacity-60 text-white font-bold py-3 rounded-full"
            >
              {sending ? 'Sending...' : 'Send order request'}
            </motion.button>
          </div>
        </div>,
        document.body
      )}

      <Modal open={showGuestModal} onClose={() => setShowGuestModal(false)} title="Continue as guest?">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          You're not logged in. You can log in to keep track of your orders, or continue without an
          account - we'll still send your request, but you won't be able to see it under your own
          order history later.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={continueWithLogin}
            className="w-full bg-wa-green hover:bg-wa-green-dark text-white font-semibold py-2.5 rounded-md"
          >
            Continue with login
          </button>
          <button
            onClick={continueWithoutLogin}
            className="w-full border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-800"
          >
            Continue without login
          </button>
        </div>
      </Modal>

      <Toast toast={toast} />
    </div>
  );
}
