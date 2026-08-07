import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

function getPageNumbers(page, totalPages) {
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  return [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-neutral-700"
      >
        <FontAwesomeIcon icon={faChevronLeft} size="xs" />
      </button>

      {pageNumbers.map((p, i) => {
        const prev = pageNumbers[i - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {showEllipsis && <span className="px-1 text-gray-400 dark:text-gray-600">…</span>}
            <button
              onClick={() => onChange(p)}
              className={`w-9 h-9 rounded-full text-sm font-semibold ${
                p === page
                  ? 'bg-wa-green text-white'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-neutral-700"
      >
        <FontAwesomeIcon icon={faChevronRight} size="xs" />
      </button>
    </div>
  );
}
