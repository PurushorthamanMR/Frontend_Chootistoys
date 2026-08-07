import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faGift,
  faTruckFast,
  faShieldHalved,
  faHeadset,
  faBoxesStacked,
  faChartLine,
  faCircleDollarToSlot,
} from '@fortawesome/free-solid-svg-icons';
import { useSettings } from '../context/SettingsContext';

const CUSTOMER_PERKS = [
  { icon: faGift, text: 'Handpicked toys for every age' },
  { icon: faTruckFast, text: 'Fast, reliable delivery' },
  { icon: faShieldHalved, text: 'Secure checkout, every order' },
  { icon: faHeadset, text: 'Friendly support on WhatsApp' },
];

const SELLER_PERKS = [
  { icon: faBoxesStacked, text: 'Manage your listings' },
  { icon: faChartLine, text: 'Track sales in real time' },
  { icon: faCircleDollarToSlot, text: 'Get paid on time' },
];

// Shared shell for /login, /register, /apply-seller, /seller-login. Rendered
// once by the nested layout route in App.jsx and kept mounted across all
// four paths, so switching between them crossfades just the hero copy and
// the <Outlet/> form content instead of remounting the whole page.
//
// Desktop and mobile deliberately use different layouts, not just a hidden
// panel:
// - Desktop is a fixed-height centered split card (hero + form) that never
//   grows past the viewport - the form side scrolls internally on its own
//   if a page (like Apply Seller's longer form) doesn't fit, so the
//   document itself never shows a scrollbar.
// - Mobile is a curved gradient header (with a working back button and a
//   short two-line greeting) with the white form sheet overlapping it,
//   matching the reference app-style login/signup screens - full-bleed,
//   no card border, and the page is allowed to scroll normally since
//   that's the native feel on a phone.
export default function AuthLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const storeName = settings?.store_name || 'Soon';

  const AUTH_CONFIG = {
    '/login': {
      title: storeName,
      subtitle: 'Welcome back! Sign in to track orders, manage your wishlist and check out faster.',
      mobileTitle: ['Hello,', 'Sign in!'],
      perks: CUSTOMER_PERKS,
    },
    '/register': {
      title: storeName,
      subtitle: 'Create your account and start shopping smarter.',
      mobileTitle: ['Create Your', 'Account'],
      perks: CUSTOMER_PERKS,
    },
    '/apply-seller': {
      title: 'Sell With Us',
      subtitle: 'Apply to become a seller and reach thousands of customers.',
      mobileTitle: ['Become a', 'Seller'],
      perks: SELLER_PERKS,
    },
    '/seller-login': {
      title: 'Seller Portal',
      subtitle: 'Sign in to manage your listings, orders and payouts.',
      mobileTitle: ['Seller', 'Portal'],
      perks: SELLER_PERKS,
    },
  };

  const config = AUTH_CONFIG[location.pathname] || AUTH_CONFIG['/login'];

  return (
    <div className="md:h-screen md:flex md:items-center md:justify-center md:overflow-hidden bg-white dark:bg-black">
      {/* Mobile-only curved gradient header with back button */}
      <div className="md:hidden relative bg-gradient-to-br from-wa-teal to-wa-green-dark text-white px-6 pt-12 pb-16 rounded-b-[2.5rem]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="mt-8"
          >
            <h1 className="text-2xl font-bold leading-tight">
              {config.mobileTitle[0]}
              <br />
              {config.mobileTitle[1]}
            </h1>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="-mt-8 md:mt-0 relative md:max-w-4xl md:w-full md:mx-4 md:grid md:grid-cols-2 md:grid-rows-[minmax(0,1fr)] bg-white dark:bg-neutral-900 rounded-t-[2.5rem] md:rounded-t-none md:border md:border-gray-100 md:dark:border-neutral-800 md:rounded-2xl md:shadow-lg dark:shadow-none overflow-hidden md:max-h-[calc(100vh-4rem)]">
        <div className="hidden md:flex md:min-h-0 flex-col bg-gradient-to-br from-wa-teal to-wa-green-dark text-white p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex flex-col justify-between h-full"
            >
              <div>
                <h1 className="text-2xl font-bold">{config.title}</h1>
                <p className="mt-2 text-white/80">{config.subtitle}</p>
              </div>
              <ul className="space-y-4 mt-10">
                {config.perks.map((perk) => (
                  <li key={perk.text} className="flex items-center gap-3 text-sm">
                    <span className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15">
                      <FontAwesomeIcon icon={perk.icon} className="text-base" />
                    </span>
                    <span className="text-white/90">{perk.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-6 pt-8 pb-10 md:p-10 md:overflow-y-auto md:min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
