const SIZE_CLASSES = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-[3px]',
  xl: 'w-14 h-14 border-4',
};

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block ${SIZE_CLASSES[size]} rounded-full border-gray-200 dark:border-neutral-700 border-t-wa-green-dark dark:border-t-wa-green animate-spin ${className}`}
    />
  );
}
