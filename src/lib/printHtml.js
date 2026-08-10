// Prints an HTML fragment through a hidden iframe rather than window.print()
// on the live page - keeps the print job fully isolated from the app's own
// DOM/CSS so it can never affect (or be affected by) whatever page is open.
export function printHtml(bodyHtml, title = 'Print') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${bodyHtml}</body></html>`);
  doc.close();

  function cleanup() {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 500);
  }

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    cleanup();
  };
}
