import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const SetupStatusContext = createContext(null);

// Used when setup-status can't be fetched — keeps the Admin sidebar gated
// instead of treating "unknown" as complete.
const INCOMPLETE_FALLBACK = {
  sections: [],
  completedCount: 0,
  totalCount: 6,
  percent: 0,
};

// Scoped to the admin panel only (mounted in AdminLayout, not at the app
// root) - the /settings/setup-status endpoint is admin-only, and the public
// SettingsContext wraps every page including logged-out customer pages.
// Fetches on its own mount (not left to whichever consumer happens to render
// first) so AdminSidebar can gate navigation on it immediately.
export function SetupStatusProvider({ children }) {
  const [setupStatus, setSetupStatus] = useState(null);

  function refreshSetupStatus() {
    return api
      .get('/settings/setup-status')
      .then((res) => {
        setSetupStatus(res.data);
        return res.data;
      })
      .catch((err) => {
        // Fail closed: never unlock the full admin nav because the check failed.
        setSetupStatus((prev) => prev ?? INCOMPLETE_FALLBACK);
        throw err;
      });
  }

  useEffect(() => {
    refreshSetupStatus().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SetupStatusContext.Provider value={{ setupStatus, refreshSetupStatus }}>
      {children}
    </SetupStatusContext.Provider>
  );
}

export function useSetupStatus() {
  return useContext(SetupStatusContext);
}
