export default function ActiveTabs({ active, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
          active
            ? 'bg-wa-green text-white'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        Active
      </button>
      <button
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
          !active
            ? 'bg-wa-green text-white'
            : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
        }`}
      >
        Inactive
      </button>
    </div>
  );
}
