import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function AdminFilterBar({ search, onSearchChange, placeholder = 'Search...', children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
      <div className="flex items-center flex-1 min-w-0 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg px-3 focus-within:ring-2 focus-within:ring-wa-green">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-gray-400 shrink-0" size="sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-2 text-base sm:text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
          >
            <FontAwesomeIcon icon={faXmark} size="sm" />
          </button>
        )}
      </div>
      {children && <div className="flex gap-2 flex-wrap shrink-0">{children}</div>}
    </div>
  );
}
