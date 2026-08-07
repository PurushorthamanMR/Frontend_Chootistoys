import { resolveMediaUrl } from '../lib/mediaUrl';

/** Drop-in <img> that fixes Google Drive embed URLs and skips broken referrers. */
export default function MediaImg({ src, alt = '', className, ...rest }) {
  if (!src) return null;
  return (
    <img
      src={resolveMediaUrl(src)}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}
