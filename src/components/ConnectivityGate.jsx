import { useEffect, useState } from 'react';
import ConnectionBroken from '../pages/ConnectionBroken';

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

  if (broken) {
    return <ConnectionBroken onRetry={() => window.location.reload()} />;
  }

  return children;
}
