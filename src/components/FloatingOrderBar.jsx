import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';

const HIDDEN_PREFIXES = ['/cart', '/checkout', '/admin', '/login', '/register'];

export default function FloatingOrderBar() {
  const { count } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const hidden = HIDDEN_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  const show = !hidden && count > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-24 lg:bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-40"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/cart')}
            className="w-full bg-wa-green hover:bg-wa-green-dark text-white font-bold py-3.5 rounded-full shadow-lg shadow-black/30 flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faCartShopping} aria-hidden />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                View order request ({count})
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
