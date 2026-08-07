import { useEffect, useState } from 'react';
import ReconnectingOverlay from './ReconnectingOverlay';

const HEALTH_URL = `${(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')}/health`;
const POLL_INTERVAL_MS = 3000;

export default function ConnectivityGate({ children }) {
  const [broken, setBroken] = useState(!navigator.onLine);

  useEffect(() => {
    const markBroken = () => setBroken(true);
    const markRestored = () => setBroken(false);

    window.addEventListener('offline', markBroken);
    window.addEventListener('online', markRestored);
    window.addEventListener('ccs:connection-lost', markBroken);
    window.addEventListener('ccs:connection-restored', markRestored);

    return () => {
      window.removeEventListener('offline', markBroken);
      window.removeEventListener('online', markRestored);
      window.removeEventListener('ccs:connection-lost', markBroken);
      window.removeEventListener('ccs:connection-restored', markRestored);
    };
  }, []);

  // While broken, quietly ping the API in the background so the overlay
  // clears itself the moment the server (e.g. mid-restart after a Settings
  // save) comes back - no manual reload needed.
  useEffect(() => {
    if (!broken) return;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(HEALTH_URL, { cache: 'no-store' });
        if (!cancelled && res.ok) setBroken(false);
      } catch {
        // still down - keep polling
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [broken]);

  return (
    <>
      {children}
      {broken && <ReconnectingOverlay onRetry={() => window.location.reload()} />}
    </>
  );
}
