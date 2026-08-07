import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import MediaImg from './MediaImg';

const TONE_STYLES = {
  default: 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700',
  edit: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
  success: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20',
};

/**
 * One stacked card row for the mobile ("lg:hidden") view of every Admin
 * Panel list page - replaces the desktop-only <table>. Tapping the body or
 * chevron calls onView (navigates to a Detail page); action buttons are
 * separate tap targets that stop propagation so they don't also fire onView.
 */
export default function AdminMobileRow({ image, title, subtitle, meta, onView, actions = [] }) {
  return (
    <div className="flex items-center gap-3 py-3 px-1 border-b border-gray-100 dark:border-neutral-800 last:border-b-0">
      {image !== undefined && (
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center text-gray-400 dark:text-neutral-600">
          {image ? <MediaImg src={image} alt="" className="w-full h-full object-cover" /> : title?.trim().charAt(0).toUpperCase()}
        </div>
      )}
      <button type="button" onClick={onView} className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</p>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
      </button>
      {meta && <div className="shrink-0 text-right">{meta}</div>}
      <div className="flex items-center gap-1.5 shrink-0">
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            aria-label={action.label}
            title={action.label}
            className={`w-8 h-8 flex items-center justify-center rounded-full ${TONE_STYLES[action.tone || 'default']}`}
          >
            <FontAwesomeIcon icon={action.icon} size="xs" />
          </button>
        ))}
        <button
          type="button"
          onClick={onView}
          aria-label="View details"
          className="w-6 h-6 flex items-center justify-center text-gray-300 dark:text-neutral-600"
        >
          <FontAwesomeIcon icon={faChevronRight} size="sm" />
        </button>
      </div>
    </div>
  );
}
