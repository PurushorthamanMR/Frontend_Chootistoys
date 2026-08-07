import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation, faHouse, faRotateRight } from '@fortawesome/free-solid-svg-icons';

// Rendered by ErrorBoundary when a page crashes with a JS error.
// Deliberately avoids react-router (the crash may have happened inside Router context)
// and uses plain <a>/reload so it always works even if the app tree is broken.
export default function PageBroken() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center text-2xl mb-4">
          <FontAwesomeIcon icon={faTriangleExclamation} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This page ran into an unexpected error. Try reloading, or head back to the home page.
        </p>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-5 py-2.5 rounded-md"
          >
            <FontAwesomeIcon icon={faRotateRight} />
            Reload
          </button>
          <a
            href="/"
            className="inline-flex items-center gap-2 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2.5 rounded-md"
          >
            <FontAwesomeIcon icon={faHouse} />
            Home
          </a>
        </div>
      </div>
    </div>
  );
}
