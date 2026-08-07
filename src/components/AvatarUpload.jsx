import { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faUser } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import MediaImg from './MediaImg';

const MAX_FILE_SIZE_MB = 10;

// Rounded avatar with a pen-icon edit overlay - clicking it opens the file
// picker directly (on mobile browsers this already surfaces a native
// camera/gallery/files chooser, no custom menu needed).
export default function AvatarUpload({ src, onChange, size = 'w-24 h-24' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="inline-block">
      <div className={`relative ${size}`}>
        <div
          className={`${size} rounded-full overflow-hidden bg-gray-100 dark:bg-neutral-800 flex items-center justify-center`}
        >
          {src ? (
            <MediaImg src={src} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="text-3xl text-gray-400" />
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change photo"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-wa-green hover:bg-wa-green-dark text-white flex items-center justify-center shadow-md border-2 border-white dark:border-neutral-900 disabled:opacity-60"
        >
          <FontAwesomeIcon icon={faPen} className="text-xs" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
      {error && <p className="text-red-600 text-xs mt-1 max-w-[10rem]">{error}</p>}
    </div>
  );
}
