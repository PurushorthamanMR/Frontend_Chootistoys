import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import ImageUploadBox from '../../components/ImageUploadBox';
import LoadingBlock from '../../components/LoadingBlock';

async function findOfferById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/offers?active=1'),
    api.get('/offers?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((o) => String(o.id) === id);
}

export default function AdminOfferEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState('');
  const [found, setFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    findOfferById(id).then((offer) => {
      if (offer) {
        setImage(offer.image);
        setFound(true);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!image) {
      setError('Please upload an image');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/offers/${id}`, { image });
      navigate(`/admin/offers/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!found) return <p className="text-gray-700 dark:text-gray-300">Offer not found.</p>;

  return (
    <AdminDetailLayout title="Edit Offer">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
          <ImageUploadBox value={image} onChange={setImage} />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </AdminDetailLayout>
  );
}
