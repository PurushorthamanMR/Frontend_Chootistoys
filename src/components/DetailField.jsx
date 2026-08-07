export default function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{value ?? '-'}</p>
    </div>
  );
}
