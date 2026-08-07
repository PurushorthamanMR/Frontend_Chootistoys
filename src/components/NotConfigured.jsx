export default function NotConfigured({ height = 'h-40' }) {
  return (
    <div
      className={`flex items-center justify-center ${height} rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-gray-400 dark:text-gray-500`}
    >
      Not Configured
    </div>
  );
}
