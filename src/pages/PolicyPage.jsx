import { useSettings } from '../context/SettingsContext';
import LoadingBlock from '../components/LoadingBlock';

export default function PolicyPage({ title, contentKey }) {
  const { settings } = useSettings();
  const content = settings?.[contentKey];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-wa-green-dark dark:text-wa-green mb-6">{title}</h1>
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-6 sm:p-8">
        {settings === null ? (
          <LoadingBlock className="py-6" />
        ) : content ? (
          <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">{content}</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Content coming soon.</p>
        )}
      </div>
    </div>
  );
}
