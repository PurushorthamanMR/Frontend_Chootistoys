import { useEffect, useState } from 'react';
import Spinner from './Spinner';

// Full-screen blurred overlay shown over the last-rendered page whenever the
// backend can't be reached (e.g. a brief restart right after saving Settings).
// Sits on top instead of replacing the app so nothing mounted underneath -
// like an in-progress form - loses its state once the connection comes back.
export default function ReconnectingOverlay({ onRetry }) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRetry(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <Spinner size="xl" />
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100">Reconnecting…</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xs">
            We're having trouble reaching the server. This usually clears up in a few seconds.
          </p>
        </div>
        {showRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-semibold text-wa-green-dark dark:text-wa-green hover:underline"
          >
            Taking too long? Reload the page
          </button>
        )}
      </div>
    </div>
  );
}
