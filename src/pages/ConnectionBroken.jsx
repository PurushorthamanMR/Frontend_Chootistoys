import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWifi, faRotateRight } from '@fortawesome/free-solid-svg-icons';

// Rendered full-screen by ConnectivityGate whenever the browser goes offline
// or an API call can't reach the server at all (no response, not just an error status).
export default function ConnectionBroken({ onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-2xl mb-4">
          <FontAwesomeIcon icon={faWifi} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Connection lost</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We can't reach the server right now. Check your internet connection and try again.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-5 py-2.5 rounded-md"
        >
          <FontAwesomeIcon icon={faRotateRight} />
          Retry
        </button>
      </div>
    </div>
  );
}
