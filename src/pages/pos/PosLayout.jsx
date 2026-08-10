import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCashRegister, faClockRotateLeft, faChartLine, faArrowLeft, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const navLinkClass = ({ isActive }) =>
  `flex items-center justify-center gap-2 min-w-[2.75rem] px-2.5 sm:px-3 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-1 sm:gap-3">
          <div className="flex items-center gap-2 shrink-0 pl-1">
            <FontAwesomeIcon icon={faCashRegister} className="text-wa-green-dark dark:text-wa-green" />
            <span className="font-bold text-gray-900 dark:text-gray-100 truncate max-w-[6rem] sm:max-w-none">
              {settings?.store_name || 'POS'}
            </span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1">
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
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* Staff never gets a way back to the admin panel or storefront -
                only Admin/SuperAdmin, who came from there, get a way back. */}
            {!isStaffOnly && (
              <button
                onClick={() => navigate('/admin/dashboard')}
                aria-label="Back to Admin Panel"
                className="flex items-center justify-center gap-2 min-w-[2.75rem] px-2.5 sm:px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-neutral-800 touch-manipulation"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span className="hidden sm:inline">Back to Admin Panel</span>
              </button>
            )}
            <button
              onClick={handleLogout}
              aria-label="Logout"
              className="flex items-center justify-center gap-2 min-w-[2.75rem] px-2.5 sm:px-3 py-2.5 rounded-lg text-sm font-medium bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-500/20 touch-manipulation"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
