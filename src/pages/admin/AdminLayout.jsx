import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import SetupProgressBar from '../../components/SetupProgressBar';
import { SetupStatusProvider, useSetupStatus } from '../../context/SetupStatusContext';
import { UnsavedChangesProvider } from '../../context/UnsavedChangesContext';
import { useAuth } from '../../context/AuthContext';

const GATED_ALLOWED_PREFIXES = ['/admin/settings', '/admin/documentation'];

/** Keeps incomplete Admin setups on Settings/Documentation only — even if login
 *  or a typed URL tries to open Dashboard/Products/etc. */
function SetupRouteGate({ children }) {
  const { user } = useAuth();
  const { setupStatus } = useSetupStatus();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'Admin') return;
    // null = still loading or failed — treat as incomplete (fail closed)
    const incomplete = !setupStatus || setupStatus.percent !== 100;
    if (!incomplete) return;
    const allowed = GATED_ALLOWED_PREFIXES.some((prefix) =>
      location.pathname.startsWith(prefix)
    );
    if (!allowed) {
      navigate('/admin/settings?tab=drive', { replace: true });
    }
  }, [user?.role, setupStatus, location.pathname, navigate]);

  return children;
}

/** Confines the env-only PosSettings login to Settings -> Point of Sale only
 *  - even a typed URL to another /admin/* path bounces back here, since the
 *  child admin routes (Products, Dashboard, etc) have no role checks of
 *  their own beyond the top-level AdminRoute wrapper. */
function PosSettingsRouteGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'PosSettings') return;
    const params = new URLSearchParams(location.search);
    const onTarget = location.pathname === '/admin/settings' && params.get('tab') === 'pos';
    if (!onTarget) {
      navigate('/admin/settings?tab=pos', { replace: true });
    }
  }, [user?.role, location.pathname, location.search, navigate]);

  return children;
}

export default function AdminLayout() {
  const location = useLocation();
  const { user } = useAuth();
  // Setup-status is Admin/SuperAdmin only (see SetupStatusContext) - a
  // PosSettings login always 403s that check and falls back to "0 of 6, 0%",
  // which would misleadingly suggest the store isn't configured. This role
  // has nothing to do with onboarding, so just don't show the bar for it.
  const showSetupProgress = user?.role !== 'PosSettings';

  return (
    <SetupStatusProvider>
      <UnsavedChangesProvider>
        <SetupRouteGate>
          <PosSettingsRouteGate>
            <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
              {/* Deliberately outside the animated motion.div below - that wrapper's
                  `transform` would become the containing block for this bar's
                  `position: fixed`, trapping it so it scrolls with the page instead
                  of staying pinned to the viewport (same issue solved via a portal
                  for the Settings page's floating Save/Cancel bar). */}
              {showSetupProgress && <SetupProgressBar />}
              <AdminSidebar />
              <div className="flex-1 min-w-0">
                <div className="max-w-6xl mx-auto px-4 py-8 w-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <Outlet />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </PosSettingsRouteGate>
        </SetupRouteGate>
      </UnsavedChangesProvider>
    </SetupStatusProvider>
  );
}
