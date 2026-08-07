import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import MediaImg from './MediaImg';

const MAX_FILE_SIZE_MB = 10;

export default function ImageUploadBox({ value, onChange, disabled }) {
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
    <div>
      <label
        className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-lg py-3 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-wa-green'
        }`}
      >
        {value ? (
          <MediaImg src={value} alt="Preview" className="h-16 w-16 object-cover rounded" />
        ) : (
          <FontAwesomeIcon icon={faCamera} className="text-2xl" />
        )}
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {uploading ? 'Uploading...' : 'Click to upload image'}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500">Max {MAX_FILE_SIZE_MB}MB</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading || disabled}
        />
      </label>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
