import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import api from '../api/client';

const ORDER_BAR_PREFIXES = ['/cart', '/checkout', '/admin', '/login', '/register'];

export default function FloatingWhatsApp() {
  const [number, setNumber] = useState(null);
  const { count } = useCart();
  const { settings } = useSettings();
  const location = useLocation();

  useEffect(() => {
    api
      .get('/whatsapp/contact')
      .then((res) => setNumber(res.data.number))
      .catch(() => setNumber(null));
  }, []);

  if (!number) return null;

  const orderBarShowing = count > 0 && !ORDER_BAR_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  const storeName = settings?.store_name || 'City Cycle Stores Toys';
  const href = `https://wa.me/${number}?text=${encodeURIComponent(`Hi, I have an inquiry about ${storeName}.`)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`fixed right-4 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebd5a] text-white shadow-lg shadow-black/30 flex items-center justify-center transition-[bottom] duration-300 ${
        orderBarShowing ? 'bottom-40 lg:bottom-24' : 'bottom-20 lg:bottom-4'
      }`}
    >
      <FontAwesomeIcon icon={faWhatsapp} className="text-3xl" />
    </motion.a>
  );
}
