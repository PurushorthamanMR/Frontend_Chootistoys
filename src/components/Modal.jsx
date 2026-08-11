import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', align = 'center' }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[55]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 z-[60] overflow-y-auto flex items-start ${align === 'start' ? '' : 'sm:items-center'} justify-center p-4`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full my-8 sm:my-0 ${maxWidth}`}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-neutral-800">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              <div className="p-5">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
