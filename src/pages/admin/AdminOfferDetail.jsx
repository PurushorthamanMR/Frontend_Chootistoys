import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { confirmAction } from '../../lib/alert';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import LoadingBlock from '../../components/LoadingBlock';

async function findOfferById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/offers?active=1'),
    api.get('/offers?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((o) => String(o.id) === id);
}

export default function AdminOfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findOfferById(id).then(setOffer).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const ok = await confirmAction({ title: 'Deactivate this offer?', text: 'It will be hidden from the home page until restored.' });
    if (!ok) return;
    await api.delete(`/offers/${id}`);
    navigate('/admin/offers');
  }

  async function handleRestore() {
    await api.put(`/offers/${id}/restore`);
    setOffer((o) => ({ ...o, is_active: 1 }));
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!offer) return <p className="text-gray-700 dark:text-gray-300">Offer not found.</p>;

  return (
    <AdminDetailLayout title={`Offer #${offer.id}`}>
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
        <img src={offer.image} alt={`Offer #${offer.id}`} className="w-full max-h-64 object-cover rounded-lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Status: {offer.is_active ? 'Active' : 'Inactive'}</p>

        <div className="flex gap-2 pt-2">
          {offer.is_active ? (
            <>
              <button
                onClick={() => navigate(`/admin/offers/${id}/edit`)}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20"
              >
                <FontAwesomeIcon icon={faPen} size="xs" /> Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <FontAwesomeIcon icon={faTrash} size="xs" /> Delete
              </button>
            </>
          ) : (
            <button
              onClick={handleRestore}
              className="flex items-center gap-2 bg-wa-green/10 text-wa-green-dark dark:text-wa-green font-semibold px-4 py-2 rounded-md hover:bg-wa-green/20"
            >
              <FontAwesomeIcon icon={faRotateRight} size="xs" /> Restore
            </button>
          )}
        </div>
      </div>
    </AdminDetailLayout>
  );
}
