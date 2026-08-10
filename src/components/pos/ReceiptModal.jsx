import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import Modal from '../Modal';
import { printHtml } from '../../lib/printHtml';

// Shared preview + print surface for both the post-checkout receipt and
// reprints from Sales History - `html` is the same string handed to
// printHtml, built once by receiptTemplate.js so the preview and the
// physical printout can never drift apart.
export default function ReceiptModal({ open, onClose, html, title = 'Receipt' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div
        className="border border-gray-200 dark:border-neutral-700 rounded-lg p-3 bg-white text-black max-h-[60vh] overflow-y-auto"
        dangerouslySetInnerHTML={{ __html: html || '' }}
      />
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 font-semibold px-4 py-2.5 rounded-lg"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => printHtml(html, title)}
          className="flex-1 flex items-center justify-center gap-2 bg-wa-green hover:bg-wa-green-dark text-white font-bold px-4 py-2.5 rounded-lg"
        >
          <FontAwesomeIcon icon={faPrint} />
          Print
        </button>
      </div>
    </Modal>
  );
}
