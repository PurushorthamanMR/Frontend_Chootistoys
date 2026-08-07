import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

/** Shared header (back button + title) for admin Detail/Edit pages. */
export default function AdminDetailLayout({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      {children}
    </div>
  );
}
