import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun,
  faMoon,
  faXmark,
  faShapes,
  faBox,
  faUser,
  faToolbox,
  faRightFromBracket,
  faRightToBracket,
  faUserPlus,
  faMagnifyingGlass,
  faFilter,
  faHeart,
  faStore,
  faCartShopping,
  faLayerGroup,
  faNewspaper,
  faHouse,
  faFileContract,
  faArrowRotateLeft,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { useCurrency } from '../context/CurrencyContext';
import { CURRENCIES } from '../lib/currency';
import { resolveMediaUrl } from '../lib/mediaUrl';
import MediaImg from './MediaImg';

function SearchBar({ value, onChange, onSubmit, className = '' }) {
  return (
    <form
      onSubmit={onSubmit}
      className={`flex items-center bg-white dark:bg-neutral-800 rounded-full shadow-inner ring-1 ring-black/5 dark:ring-white/10 focus-within:ring-2 focus-within:ring-wa-green transition-shadow ${className}`}
    >
      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 ml-4 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search for toys..."
        className="flex-1 min-w-0 bg-transparent px-3 py-2 text-base sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange({ target: { value: '' } })}
          aria-label="Clear search"
          className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
        >
          <FontAwesomeIcon icon={faXmark} size="sm" />
        </button>
      )}
      <motion.button
        type="submit"
        whileTap={{ scale: 0.92 }}
        aria-label="Search"
        className="bg-wa-green hover:bg-wa-green-dark text-white w-9 h-9 rounded-full flex items-center justify-center shrink-0 m-1"
      >
        <FontAwesomeIcon icon={faMagnifyingGlass} size="sm" />
      </motion.button>
    </form>
  );
}

function DrawerItem({ icon, label, onClick, danger }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ x: 4 }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium ${
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-800'
      }`}
    >
      <span className="w-5 text-lg flex items-center justify-center">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}

function CurrencyPicker({ currency, setCurrency }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Currency</p>
      <div className="grid grid-cols-3 gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className={`text-sm px-2 py-2 rounded-lg border font-medium ${
              currency.code === c.code
                ? 'border-wa-green bg-wa-green/10 text-wa-green-dark dark:text-wa-green'
                : 'border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>
    </div>
  );
}

function FilterMenuItems({ theme, toggleTheme, currency, setCurrency, user, go }) {
  return (
    <>
      <DrawerItem
        icon={<FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />}
        label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        onClick={toggleTheme}
      />
      <CurrencyPicker currency={currency} setCurrency={setCurrency} />
      <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />
      {user && <DrawerItem icon={<FontAwesomeIcon icon={faHeart} />} label="Wishlist" onClick={() => go('/wishlist')} />}
      <DrawerItem icon={<FontAwesomeIcon icon={faStore} />} label="Become a Seller" onClick={() => go('/apply-seller')} />
      <DrawerItem icon={<FontAwesomeIcon icon={faRightToBracket} />} label="Seller Login" onClick={() => go('/seller-login')} />
    </>
  );
}

const desktopRow2LinkClass = ({ isActive }) =>
  `hover:opacity-80 ${isActive ? 'font-bold' : ''}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { currency, setCurrency } = useCurrency();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownCloseTimer = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuCloseTimer = useRef(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef(null);
  const isFirstSearchRender = useRef(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [urlParams] = useSearchParams();
  const urlSearch = urlParams.get('search') || '';
  const urlCategory = urlParams.get('category') || '';

  useEffect(() => {
    document.body.style.overflow = menuOpen || filterOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen, filterOpen]);

  // Keep the search box in sync with the URL (e.g. arriving on /products
  // via a category link, or the box being reopened after a search).
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    const trimmed = search.trim();
    const handle = setTimeout(() => {
      if (trimmed === urlSearch) return;
      const params = {};
      if (urlCategory) params.category = urlCategory;
      if (trimmed) params.search = trimmed;
      navigate(Object.keys(params).length ? `/products?${new URLSearchParams(params).toString()}` : '/products');
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchRef.current?.querySelector('input')?.focus();
    }
  }, [mobileSearchOpen]);

  function handleSearch(e) {
    e.preventDefault();
    const params = {};
    if (urlCategory) params.category = urlCategory;
    if (search) params.search = search;
    navigate(Object.keys(params).length ? `/products?${new URLSearchParams(params).toString()}` : '/products');
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }

  function go(path) {
    navigate(path);
    setMenuOpen(false);
    setFilterOpen(false);
    setFilterDropdownOpen(false);
    setUserMenuOpen(false);
  }

  function openUserMenu() {
    clearTimeout(userMenuCloseTimer.current);
    setUserMenuOpen(true);
  }

  // Small delay before closing so moving the mouse from the avatar down
  // into the dropdown (across the gap between them) doesn't close it.
  function scheduleCloseUserMenu() {
    clearTimeout(userMenuCloseTimer.current);
    userMenuCloseTimer.current = setTimeout(() => setUserMenuOpen(false), 150);
  }

  function openFilterDropdown() {
    clearTimeout(filterDropdownCloseTimer.current);
    setFilterDropdownOpen(true);
  }

  function scheduleCloseFilterDropdown() {
    clearTimeout(filterDropdownCloseTimer.current);
    filterDropdownCloseTimer.current = setTimeout(() => setFilterDropdownOpen(false), 150);
  }

  const isAdmin = user && ['Admin', 'SuperAdmin'].includes(user.role);
  const initial = user ? user.name.trim().charAt(0).toUpperCase() : <FontAwesomeIcon icon={faUser} />;

  return (
    <header className="bg-wa-teal dark:bg-black text-white shadow-md sticky top-0 z-50 dark:border-b dark:border-wa-green/30">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="lg:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 bg-white/10 hover:bg-white/20 rounded-md shrink-0"
          >
            <span className="block w-4 h-0.5 bg-white rounded-full" />
            <span className="block w-4 h-0.5 bg-white rounded-full" />
            <span className="block w-2.5 h-0.5 bg-white rounded-full self-end mr-1.5" />
          </motion.button>

          <Link to="/" className="text-xl sm:text-2xl font-extrabold tracking-tight whitespace-nowrap flex items-center gap-2">
            {settings?.store_icon && (
              <img
                src={resolveMediaUrl(settings.store_icon)}
                alt=""
                className="w-11 h-11 sm:w-14 sm:h-14 object-contain shrink-0 scale-125 lg:scale-150"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="hidden lg:inline">{settings?.store_name || 'Soon'}</span>
            <span className="lg:hidden">{settings?.store_short_name || 'Soon'}</span>
          </Link>

          <SearchBar
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-md"
          />

          {/* Desktop row 1: Filter + user */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            <div className="relative" onMouseEnter={openFilterDropdown} onMouseLeave={scheduleCloseFilterDropdown}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                aria-label="Filters"
                title="Filters"
                className="w-9 h-9 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20"
              >
                <FontAwesomeIcon icon={faFilter} />
              </motion.button>
              <AnimatePresence>
                {filterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-800 z-50 text-gray-900 dark:text-gray-100 py-2"
                  >
                    <FilterMenuItems theme={theme} toggleTheme={toggleTheme} currency={currency} setCurrency={setCurrency} user={user} go={go} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="relative" onMouseEnter={openUserMenu} onMouseLeave={scheduleCloseUserMenu}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  title={user.name}
                  className="flex items-center gap-2 hover:opacity-90"
                >
                  <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                    {user.image ? (
                      <MediaImg src={user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initial
                    )}
                  </span>
                  <span className="text-sm font-medium">{user.name.split(' ')[0]}</span>
                </motion.button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-800 z-50 text-gray-900 dark:text-gray-100 py-2"
                    >
                      <DrawerItem icon={<FontAwesomeIcon icon={faUser} />} label="My Account" onClick={() => go('/profile')} />
                      <DrawerItem icon={<FontAwesomeIcon icon={faBox} />} label="My Orders" onClick={() => go('/my-orders')} />
                      {isAdmin && (
                        <DrawerItem icon={<FontAwesomeIcon icon={faToolbox} />} label="Admin Panel" onClick={() => go('/admin')} />
                      )}
                      <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />
                      <DrawerItem
                        icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                        label="Logout"
                        danger
                        onClick={() => {
                          logout();
                          window.location.href = '/';
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
                <FontAwesomeIcon icon={faUser} />
                <Link to="/login" className="hover:underline">Login</Link>
                <span className="opacity-50">|</span>
                <Link to="/register" className="hover:underline">Registration</Link>
              </div>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-3 ml-auto">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label={mobileSearchOpen ? 'Close search' : 'Search'}
              className={`w-9 h-9 flex items-center justify-center rounded-md shrink-0 ${
                mobileSearchOpen ? 'bg-white/25' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <FontAwesomeIcon icon={mobileSearchOpen ? faXmark : faMagnifyingGlass} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFilterOpen(true)}
              aria-label="Filters"
              title="Filters"
              className="w-9 h-9 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 shrink-0"
            >
              <FontAwesomeIcon icon={faFilter} />
            </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileSearchOpen && (
            <motion.div
              ref={mobileSearchRef}
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden"
            >
              <SearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onSubmit={handleSearch}
                className="flex"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop row 2: primary nav + cart */}
      <div className="hidden lg:block border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between text-sm font-medium">
          <nav className="flex items-center gap-6">
            <NavLink to="/" end className={desktopRow2LinkClass}>Home</NavLink>
            <NavLink to="/blogs" className={desktopRow2LinkClass}>Blogs</NavLink>
            <NavLink to="/products" className={desktopRow2LinkClass}>All Product</NavLink>
            <NavLink to="/categories" className={desktopRow2LinkClass}>All Categories</NavLink>
          </nav>
          <Link to="/cart" className="flex items-center gap-2 hover:opacity-80">
            <FontAwesomeIcon icon={faCartShopping} />
            <span>Cart ({count})</span>
          </Link>
        </div>
      </div>

      {/* Mobile hamburger drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed top-0 left-0 h-full w-[82%] max-w-xs bg-white dark:bg-neutral-950 z-50 shadow-2xl flex flex-col text-gray-900 dark:text-gray-100"
            >
              <div className="bg-gradient-to-br from-wa-teal to-wa-green dark:from-black dark:to-neutral-900 text-white px-5 pt-6 pb-5 relative">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </motion.button>

                {user ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3 overflow-hidden">
                      {user.image ? (
                        <MediaImg src={user.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm opacity-80">{user.email}</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-lg mb-3">Welcome!</p>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => go('/login')}
                        className="flex items-center justify-center gap-2 border border-white/50 text-white font-semibold py-2.5 rounded-xl"
                      >
                        <FontAwesomeIcon icon={faRightToBracket} />
                        Sign In
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => go('/register')}
                        className="flex items-center justify-center gap-2 bg-white text-wa-green-dark font-semibold py-2.5 rounded-xl"
                      >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Sign Up
                      </motion.button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <DrawerItem icon={<FontAwesomeIcon icon={faHouse} />} label="Home" onClick={() => go('/')} />
                <DrawerItem icon={<FontAwesomeIcon icon={faNewspaper} />} label="Blogs" onClick={() => go('/blogs')} />
                <DrawerItem icon={<FontAwesomeIcon icon={faShapes} />} label="All Product" onClick={() => go('/products')} />
                <DrawerItem icon={<FontAwesomeIcon icon={faLayerGroup} />} label="All Categories" onClick={() => go('/categories')} />

                {user && (
                  <>
                    <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />
                    <DrawerItem icon={<FontAwesomeIcon icon={faUser} />} label="My Account" onClick={() => go('/profile')} />
                    <DrawerItem icon={<FontAwesomeIcon icon={faBox} />} label="My Orders" onClick={() => go('/my-orders')} />
                    <DrawerItem icon={<FontAwesomeIcon icon={faHeart} />} label="Wishlist" onClick={() => go('/wishlist')} />
                    {isAdmin && (
                      <DrawerItem icon={<FontAwesomeIcon icon={faToolbox} />} label="Admin Panel" onClick={() => go('/admin')} />
                    )}
                    <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />
                    <DrawerItem
                      icon={<FontAwesomeIcon icon={faRightFromBracket} />}
                      label="Logout"
                      danger
                      onClick={() => {
                        logout();
                        window.location.href = '/';
                      }}
                    />
                  </>
                )}

                <div className="my-2 border-t border-gray-100 dark:border-neutral-800" />
                <p className="px-4 pt-1 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Legal
                </p>
                <DrawerItem icon={<FontAwesomeIcon icon={faFileContract} />} label="Terms & Conditions" onClick={() => go('/terms')} />
                <DrawerItem icon={<FontAwesomeIcon icon={faArrowRotateLeft} />} label="Return Policy" onClick={() => go('/return-policy')} />
                <DrawerItem icon={<FontAwesomeIcon icon={faShieldHalved} />} label="Privacy Policy" onClick={() => go('/privacy-policy')} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Filter drawer: theme, currency, seller links, wishlist */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFilterOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed top-0 right-0 h-full w-[82%] max-w-xs bg-white dark:bg-neutral-950 z-50 shadow-2xl flex flex-col text-gray-900 dark:text-gray-100"
            >
              <div className="bg-gradient-to-br from-wa-teal to-wa-green dark:from-black dark:to-neutral-900 text-white px-5 pt-6 pb-5 relative">
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </motion.button>
                <p className="font-bold text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faFilter} />
                  Preferences
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
                <FilterMenuItems theme={theme} toggleTheme={toggleTheme} currency={currency} setCurrency={setCurrency} user={user} go={go} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
