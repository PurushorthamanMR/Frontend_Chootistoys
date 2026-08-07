import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCompass, faHouse } from '@fortawesome/free-solid-svg-icons';

export default function PageNotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-wa-green/10 dark:bg-wa-green/15 text-wa-green-dark dark:text-wa-green flex items-center justify-center text-2xl mb-4">
          <FontAwesomeIcon icon={faCompass} />
        </div>
        <p className="text-5xl font-extrabold text-wa-green-dark dark:text-wa-green mb-2">404</p>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Page not found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The page you're looking for doesn't exist or the URL is incorrect.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-5 py-2.5 rounded-md"
        >
          <FontAwesomeIcon icon={faHouse} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
