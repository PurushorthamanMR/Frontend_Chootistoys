import { useEffect, useRef } from 'react';
import { useSetupStatus } from '../context/SetupStatusContext';
import { successAlert } from '../lib/alert';

export default function SetupProgressBar() {
  const { setupStatus } = useSetupStatus();
  const prevPercentRef = useRef(null);

  useEffect(() => {
    if (!setupStatus) return;
    const prev = prevPercentRef.current;
    if (prev !== null && prev < 100 && setupStatus.percent === 100) {
      successAlert('Setup Completed', 'Every required setting is now configured.');
    }
    prevPercentRef.current = setupStatus.percent;
  }, [setupStatus]);

  if (!setupStatus || setupStatus.percent === 100) return null;

  return (
    <div className="fixed top-16 lg:top-4 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-full shadow-lg px-4 py-2 flex items-center gap-3 max-w-full">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
          {setupStatus.completedCount} of {setupStatus.totalCount} Completed
        </span>
        <div className="w-24 sm:w-32 h-1.5 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden shrink-0">
          <div
            className="h-full bg-wa-green rounded-full transition-all duration-500"
            style={{ width: `${setupStatus.percent}%` }}
          />
        </div>
        <span className="text-xs font-bold text-wa-green whitespace-nowrap">{setupStatus.percent}%</span>
      </div>
    </div>
  );
}
