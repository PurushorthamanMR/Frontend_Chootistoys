import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import MediaImg from './MediaImg';

const MAX_FILE_SIZE_MB = 10;

export default function ImageUploadBoxMulti({ value = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const oversized = files.find((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversized) {
      setError(`"${oversized.name}" is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        const { data } = await api.post('/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function removeImage(url) {
    onChange(value.filter((img) => img !== url));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((img) => (
          <div key={img} className="relative">
            <MediaImg src={img} alt="Upload preview" className="h-16 w-16 object-cover rounded" />
            <button
              type="button"
              onClick={() => removeImage(img)}
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faXmark} size="xs" />
            </button>
          </div>
        ))}
      </div>
      <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg py-3 cursor-pointer hover:border-wa-green transition-colors">
        <FontAwesomeIcon icon={faCamera} className="text-2xl" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {uploading ? 'Uploading...' : 'Click to upload image(s)'}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">Max {MAX_FILE_SIZE_MB}MB each</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
          disabled={uploading}
        />
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
