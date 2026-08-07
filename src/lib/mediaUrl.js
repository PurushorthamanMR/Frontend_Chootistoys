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
  return url;
}
