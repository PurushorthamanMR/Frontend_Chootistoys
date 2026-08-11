import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faDeleteLeft } from '@fortawesome/free-solid-svg-icons';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const MAX_DIGITS = 19;

// Dedicated 0-9 numeric keypad for touch quantity entry - a plain custom grid
// rather than react-simple-keyboard, so every digit is a large, reliably-laid-out
// square button instead of a squeezed-down text-keyboard row.
export default function NumPad({ value, onChange, onEnter, onClose }) {
  function press(digit) {
    const current = String(value ?? '');
    if (current.length >= MAX_DIGITS) return;
    onChange(`${current}${digit}`);
  }

  function backspace() {
    onChange(String(value ?? '').slice(0, -1));
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Num Pad</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close keyboard"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto px-3 pb-3">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 text-xl font-semibold text-gray-900 dark:text-gray-100 touch-manipulation"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          aria-label="Backspace"
          className="h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-300 touch-manipulation"
        >
          <FontAwesomeIcon icon={faDeleteLeft} />
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="h-14 rounded-xl bg-gray-100 dark:bg-neutral-800 active:bg-gray-200 dark:active:bg-neutral-700 text-xl font-semibold text-gray-900 dark:text-gray-100 touch-manipulation"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => onEnter?.()}
          className="h-14 rounded-xl bg-wa-green hover:bg-wa-green-dark text-white font-bold touch-manipulation"
        >
          Done
        </button>
      </div>
    </div>
  );
}
