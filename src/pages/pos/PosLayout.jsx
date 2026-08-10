import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faClockRotateLeft, faChartLine, faReceipt, faArrowLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const navLinkClass = ({ isActive }) =>
  `flex items-center justify-center gap-2 shrink-0 min-w-[2.25rem] sm:min-w-[2.75rem] px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
    isActive ? 'bg-wa-green text-white' : 'text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-neutral-800'
  }`;

export default function PosLayout() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const isStaffOnly = user?.role === 'Staff';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="h-full max-h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-black">
      <header className="sticky top-0 z-50 shrink-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 px-2 sm:px-4 py-2 sm:py-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1">
            <FontAwesomeIcon icon={faCashRegister} className="text-wa-green-dark dark:text-wa-green" />
            <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[3.5rem] sm:max-w-none">
              {settings?.store_name || 'POS'}
            </span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <NavLink to="/pos" end className={navLinkClass}>
              <FontAwesomeIcon icon={faCashRegister} />
              <span className="hidden sm:inline">Checkout</span>
            </NavLink>
            <NavLink to="/pos/sales-history" className={navLinkClass}>
              <FontAwesomeIcon icon={faClockRotateLeft} />
              <span className="hidden sm:inline">Sales History</span>
            </NavLink>
            <NavLink to="/pos/daily-summary" className={navLinkClass}>
              <FontAwesomeIcon icon={faChartLine} />
              <span className="hidden sm:inline">Daily Summary</span>
            </NavLink>
            <NavLink to="/pos/x-report" className={navLinkClass}>
              <FontAwesomeIcon icon={faReceipt} />
              <span className="hidden sm:inline">X-Report</span>
            </NavLink>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Staff never gets a way back to the admin panel or storefront -
                only Admin/SuperAdmin, who came from there, get a way back. */}
            {!isStaffOnly && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                aria-label="Back to Admin Panel"
                className="flex items-center justify-center gap-2 shrink-0 min-w-[2.25rem] sm:min-w-[2.75rem] px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-neutral-800 touch-manipulation"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className="hidden sm:inline">Back to Admin Panel</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="flex items-center justify-center gap-2 shrink-0 min-w-[2.25rem] sm:min-w-[2.75rem] px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-500/20 touch-manipulation"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
