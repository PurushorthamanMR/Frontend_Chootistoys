import { useEffect, useRef, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

// Self-contained, bottom-docked full QWERTY touch keyboard for POS terminals
// without a physical keyboard (search bar, login fields). Each usage site owns
// its own open/active-field state and mounts one instance of this bound to the
// field currently being edited - no global keyboard provider/context, so it
// can't affect unrelated pages. For numeric-only entry (e.g. quantity), use
// NumPad instead - a plain digit grid renders far more reliably than squeezing
// this library's row-based layout into a narrow numeric-only box.
export default function OnScreenKeyboard({ value, onChange, onEnter, onClose }) {
  const [layoutName, setLayoutName] = useState('default');
  const keyboardRef = useRef(null);

  useEffect(() => {
    keyboardRef.current?.setInput(value ?? '');
  }, [value]);

  function handleKeyPress(button) {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
      return;
    }
    if (button === '{enter}') {
      onEnter?.();
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 shadow-2xl">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">On-screen Keyboard</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close keyboard"
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>
      <div className="pb-2 px-2">
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layoutName={layoutName}
          onChange={(input) => onChange?.(input)}
          onKeyPress={handleKeyPress}
        />
      </div>
    </div>
  );
}
