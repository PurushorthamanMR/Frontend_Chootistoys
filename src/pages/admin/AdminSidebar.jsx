import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faToolbox,
  faXmark,
  faBars,
  faGauge,
  faBox,
  faFolderTree,
  faSitemap,
  faReceipt,
  faTriangleExclamation,
  faTags,
  faImages,
  faNewspaper,
  faUsers,
  faAddressBook,
  faHouse,
  faRightFromBracket,
  faGear,
  faChevronDown,
  faBook,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { useSetupStatus } from '../../context/SetupStatusContext';
import { confirmAction } from '../../lib/alert';
import api from '../../api/client';
import CustomScrollbar from '../../components/CustomScrollbar';
import { getSettingsSections } from './AdminSettings';
import { DOCUMENTATION_TABS } from './AdminDocumentation';

// Shared by every navigation trigger below (top-level links, Settings sub-tabs,
// Back to Home, Logout) - lets an in-progress Settings edit block leaving
// until the admin confirms discarding it.
async function guardLeave(hasUnsavedChanges, setHasUnsavedChanges) {
  if (!hasUnsavedChanges) return true;
  const confirmed = await confirmAction({
    title: 'Discard unsaved changes?',
    text: 'You have unsaved edits in Settings. Leaving now will discard them.',
    confirmText: 'Discard changes',
  });
  if (confirmed) setHasUnsavedChanges(false);
  return confirmed;
}

const DESKTOP_QUERY = '(min-width: 1024px)';

/** Drives desktop-sidebar vs mobile-hamburger as a single JS boolean instead
 *  of two independently-toggled CSS breakpoints on two different elements -
 *  that way there is no way for both to end up visible at once. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (e) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isDesktop;
}

function buildSections({ pendingCount, lowStockCount, pendingUsersCount, canManageUsers }) {
  return [
    {
      items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: faGauge }],
    },
    {
      label: 'Catalog',
      items: [
        { to: '/admin/products', label: 'Products', icon: faBox },
        { to: '/admin/low-stock', label: 'Low Stock', icon: faTriangleExclamation, badge: lowStockCount },
        { to: '/admin/categories', label: 'Categories', icon: faFolderTree },
        { to: '/admin/subcategories', label: 'Subcategories', icon: faSitemap },
      ],
    },
    {
      label: 'Sales',
      items: [{ to: '/admin/orders', label: 'Orders', icon: faReceipt, badge: pendingCount }],
    },
    {
      label: 'Content',
      items: [
        { to: '/admin/offers', label: 'Offers', icon: faTags },
        { to: '/admin/banners', label: 'Banners', icon: faImages },
        { to: '/admin/blogs', label: 'Blogs', icon: faNewspaper },
      ],
    },
    ...(canManageUsers
      ? [
          {
            label: 'Access',
            items: [
              { to: '/admin/customers', label: 'Customers', icon: faAddressBook },
              { to: '/admin/users', label: 'Users', icon: faUsers, badge: pendingUsersCount },
            ],
          },
        ]
      : []),
  ];
}

const DOCUMENTATION_ITEM = {
  to: '/admin/documentation',
  label: 'Documentation',
  icon: faBook,
  children: DOCUMENTATION_TABS,
};

function SidebarLink({ to, label, icon, badge, onClick }) {
  const navigate = useNavigate();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();

  async function handleClick(e) {
    if (!hasUnsavedChanges) {
      onClick?.();
      return;
    }
    e.preventDefault();
    if (!(await guardLeave(hasUnsavedChanges, setHasUnsavedChanges))) return;
    onClick?.();
    navigate(to);
  }

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-white/20' : 'hover:bg-white/10'
        }`
      }
    >
      <FontAwesomeIcon icon={icon} className="w-4 shrink-0" />
      <span className="truncate">{label}</span>
      {!!badge && (
        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] leading-[18px] text-center px-1">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

// A nav item that expands in place to show its own sub-pages as a nested
// list (currently just Settings) instead of linking straight to the page -
// lets the mobile hamburger drawer jump directly to a settings tab.
function SidebarExpandableLink({ to, label, icon, children, onClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const onParentPage = location.pathname === to;
  const [open, setOpen] = useState(onParentPage);

  useEffect(() => {
    if (onParentPage) setOpen(true);
  }, [onParentPage]);

  const activeTab = onParentPage ? searchParams.get('tab') || children[0]?.key || null : null;

  async function handleChildClick(e, childTo) {
    if (!hasUnsavedChanges) {
      onClick?.();
      return;
    }
    e.preventDefault();
    if (!(await guardLeave(hasUnsavedChanges, setHasUnsavedChanges))) return;
    onClick?.();
    navigate(childTo);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          onParentPage ? 'bg-white/20' : 'hover:bg-white/10'
        }`}
      >
        <FontAwesomeIcon icon={icon} className="w-4 shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <FontAwesomeIcon icon={faChevronDown} className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
          {children.map((child) => (
            <Link
              key={child.key}
              to={`${to}?tab=${child.key}`}
              onClick={(e) => handleChildClick(e, `${to}?tab=${child.key}`)}
              className={`block px-3 py-2 rounded-md text-sm truncate transition-colors ${
                activeTab === child.key ? 'bg-white/20 font-medium' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChanges();
  const { setupStatus } = useSetupStatus();
  // Until initial store setup is 100% complete, restrict the nav to just
  // Documentation/Settings/Logout so a fresh install can't wander into pages
  // that assume it's already configured. Treat "still loading" as incomplete
  // too, so the full nav never flashes in before yanking back out. SuperAdmin
  // is treated as the developer role and is exempt from this onboarding gate.
  const setupIncomplete = !setupStatus || setupStatus.percent !== 100;
  const gatingActive = setupIncomplete && user?.role === 'Admin';
  const settingsItem = {
    to: '/admin/settings',
    label: 'Settings',
    icon: faGear,
    children: getSettingsSections(user?.role === 'SuperAdmin'),
  };
  const navScrollRef = useRef(null);
  const settingsAnchorRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);
  const canManageUsers = ['Admin', 'SuperAdmin'].includes(user?.role);
  const onSettingsPage = location.pathname === '/admin/settings';
  const onDocsPage = location.pathname === '/admin/documentation';

  // Orders/Users badges poll on an interval so they update live while the
  // admin panel is open, not just when navigating between pages - a new
  // order or seller application shouldn't need a page change to show up.
  useEffect(() => {
    function fetchPendingCounts() {
      api.get('/orders').then((res) => {
        setPendingCount(res.data.filter((o) => o.status === 'pending').length);
      }).catch(() => {});
      if (canManageUsers) {
        api.get('/users?status=pending').then((res) => {
          setPendingUsersCount(res.data.length);
        }).catch(() => {});
      }
    }
    fetchPendingCounts();
    const interval = setInterval(fetchPendingCounts, 15000);
    return () => clearInterval(interval);
  }, [canManageUsers]);

  useEffect(() => {
    api.get('/products?lowStock=true').then((res) => {
      setLowStockCount(res.data.length);
    }).catch(() => {});
  }, [location.pathname]);

  // Settings / Documentation live at the bottom of the drawer — when opening
  // the hamburger while already on one of those pages, scroll down so the
  // active sub-nav is visible.
  useEffect(() => {
    if (!menuOpen || (!onSettingsPage && !onDocsPage)) return;
    const t = window.setTimeout(() => {
      const container = navScrollRef.current;
      if (container) container.scrollTop = container.scrollHeight;
      settingsAnchorRef.current?.scrollIntoView({ block: 'nearest' });
    }, 80);
    return () => clearTimeout(t);
  }, [menuOpen, onSettingsPage, onDocsPage]);

  async function handleLogout() {
    if (!(await guardLeave(hasUnsavedChanges, setHasUnsavedChanges))) return;
    logout();
    setMenuOpen(false);
    window.location.href = '/';
  }

  async function handleBackToHome(onLinkClick) {
    if (!(await guardLeave(hasUnsavedChanges, setHasUnsavedChanges))) return;
    onLinkClick?.();
    navigate('/');
  }

  const sections = gatingActive
    ? []
    : buildSections({ pendingCount, lowStockCount, pendingUsersCount, canManageUsers });

  const brand = (
    <Link
      to={gatingActive ? '/admin/settings?tab=drive' : '/admin/dashboard'}
      className="font-extrabold text-lg flex items-center gap-2"
    >
      <FontAwesomeIcon icon={faToolbox} />
      Admin Panel
    </Link>
  );

  function navContent(onLinkClick) {
    return (
      <nav className="px-3 py-4 space-y-5">
        {sections.map((section, i) => (
          <div key={section.label || i}>
            {section.label && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                {section.label}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) =>
                item.children ? (
                  <SidebarExpandableLink key={item.to} {...item} onClick={onLinkClick} />
                ) : (
                  <SidebarLink key={item.to} {...item} onClick={onLinkClick} />
                )
              )}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  function footerActions(onLinkClick) {
    return (
      <div
        className={`px-3 py-4 space-y-1 shrink-0 ${gatingActive ? 'border-b border-white/10' : 'border-t border-white/10'}`}
      >
        <div ref={settingsAnchorRef} className="space-y-1">
          <SidebarExpandableLink {...DOCUMENTATION_ITEM} onClick={onLinkClick} />
          {canManageUsers && <SidebarExpandableLink {...settingsItem} onClick={onLinkClick} />}
        </div>
        {!gatingActive && (
          <button
            onClick={() => handleBackToHome(onLinkClick)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10"
          >
            <FontAwesomeIcon icon={faHouse} className="w-4" />
            Back to Home
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-wa-green hover:bg-wa-green-dark"
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
          Logout
        </button>
      </div>
    );
  }

  // While gated (first-time setup, Admin role only), Documentation/Settings/Logout
  // move to the top of the sidebar instead of the bottom - there's nothing else
  // above them to push them down to, and it reads better as "start here."
  // Once setup is 100% (or for SuperAdmin, always), they sit at the bottom as usual.
  function navAndFooter(onLinkClick) {
    return gatingActive ? (
      <>
        {footerActions(onLinkClick)}
        <div className="flex-1">{navContent(onLinkClick)}</div>
      </>
    ) : (
      <>
        <div className="flex-1">{navContent(onLinkClick)}</div>
        {footerActions(onLinkClick)}
      </>
    );
  }

  if (isDesktop) {
    return (
      <aside className="flex flex-col w-64 shrink-0 h-screen sticky top-0 bg-wa-teal dark:bg-black text-white dark:border-r dark:border-wa-green/30">
        <div className="px-4 py-5 border-b border-white/10 shrink-0">{brand}</div>
        <div className="relative flex-1 min-h-0">
          <div ref={navScrollRef} className="scrollbar-none h-full overflow-y-auto flex flex-col">
            {navAndFooter()}
          </div>
          <CustomScrollbar containerRef={navScrollRef} thumbClassName="bg-white/25 hover:bg-white/40" />
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile hamburger navbar */}
      <header className="bg-wa-teal dark:bg-black text-white shadow-md sticky top-0 z-40 dark:border-b dark:border-wa-green/30">
        <div className="px-3 sm:px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
            className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-md shrink-0"
          >
            <FontAwesomeIcon icon={faBars} />
          </motion.button>
          {brand}
        </div>
      </header>

      {/* Mobile menu: slide-in overlay, closed by default, doesn't affect page layout */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 h-full w-[78%] max-w-xs z-50 bg-wa-teal dark:bg-black text-white shadow-2xl flex flex-col"
            >
              <div className="px-4 py-5 border-b border-white/10 shrink-0 flex items-center justify-between">
                {brand}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center shrink-0"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </motion.button>
              </div>
              <p className="px-4 pt-3 pb-1 text-xs opacity-70 shrink-0">{user?.name} · {user?.role}</p>
              <div className="relative flex-1 min-h-0">
                <div ref={navScrollRef} className="scrollbar-none h-full overflow-y-auto flex flex-col">
                  {navAndFooter(() => setMenuOpen(false))}
                </div>
                <CustomScrollbar containerRef={navScrollRef} thumbClassName="bg-white/25 hover:bg-white/40" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
