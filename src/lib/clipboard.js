/**
 * Copy text to the clipboard. Uses the Clipboard API in secure contexts
 * (HTTPS / localhost); falls back to execCommand for mobile browsers on
 * plain HTTP (e.g. http://192.168.x.x) where clipboard.writeText is blocked.
 */
export async function copyText(text) {
  const value = String(text ?? '');

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall through to the legacy path.
    }
  }

  const ta = document.createElement('textarea');
  ta.value = value;
  // iOS Safari zooms inputs under 16px and can reject off-screen selection.
  ta.style.cssText =
    'position:fixed;top:0;left:0;width:2em;height:2em;padding:0;border:none;outline:none;box-shadow:none;background:transparent;font-size:16px;';
  ta.setAttribute('readonly', '');
  document.body.appendChild(ta);

  ta.focus();
  ta.select();
  ta.setSelectionRange(0, value.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }

  document.body.removeChild(ta);
  return ok;
}
