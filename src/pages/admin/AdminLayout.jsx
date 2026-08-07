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

export default function AdminLayout() {
  const location = useLocation();

  return (
    <SetupStatusProvider>
      <UnsavedChangesProvider>
        <SetupRouteGate>
          <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-black">
            {/* Deliberately outside the animated motion.div below - that wrapper's
                `transform` would become the containing block for this bar's
                `position: fixed`, trapping it so it scrolls with the page instead
                of staying pinned to the viewport (same issue solved via a portal
                for the Settings page's floating Save/Cancel bar). */}
            <SetupProgressBar />
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
        </SetupRouteGate>
      </UnsavedChangesProvider>
    </SetupStatusProvider>
  );
}
