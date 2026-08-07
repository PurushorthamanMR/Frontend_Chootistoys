/**
 * Backend-relative paths (local-disk uploads under /uploads, bundled defaults
 * under /img) need the backend's own origin prefixed. In dev, VITE_API_BASE_URL
 * is unset and Vite's proxy forwards those paths to the backend, so bare paths
 * are left as-is. In production the frontend and backend live on different
 * domains (e.g. www.chootistoys.com vs backend.chootistoys.com), so a bare
 * "/uploads/x.jpg" would otherwise resolve against the frontend's own origin
 * and 404.
 */
function backendOrigin() {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    // Relative base (e.g. "/api") - no separate backend origin to prefix with.
    return '';
  }
}

/**
 * Google Drive's old uc?export=view embed URLs often return 403 in <img> tags.
 * Normalize known Drive URL shapes to the thumbnail endpoint, which works for
 * publicly shared files.
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;

  if (url.includes('drive.google.com/thumbnail?')) return url;
  if (url.includes('lh3.googleusercontent.com/d/')) return url;

  let id = null;
  const fromUc = url.match(/drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (fromUc) id = fromUc[1];
  if (!id) {
    const fromFile = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (fromFile) id = fromFile[1];
  }
  if (!id) {
    const fromOpen = url.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (fromOpen && /drive\.google\.com/i.test(url)) id = fromOpen[1];
  }

  if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`;

  if (url.startsWith('/')) {
    const origin = backendOrigin();
    if (origin) return `${origin}${url}`;
  }

  return url;
}
