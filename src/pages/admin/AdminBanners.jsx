import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import ImageUploadBox from '../../components/ImageUploadBox';
import ActiveTabs from '../../components/ActiveTabs';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';

const PAGE_SIZE = 9;

export default function AdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [image, setImage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(true);
  const [page, setPage] = useState(1);

  function load() {
    api.get(`/banners?active=${activeTab ? '1' : '0'}`).then((res) => setBanners(res.data));
  }

  useEffect(load, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  function openAddModal() {
    setEditingId(null);
    setImage('');
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setImage('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!image) {
      setError('Please upload an image');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/banners/${editingId}`, { image });
      } else {
        await api.post('/banners', { image });
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save banner');
    }
  }

  function startEdit(banner) {
    setEditingId(banner.id);
    setImage(banner.image);
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this banner?', text: 'It will be hidden from the home page until restored.' });
    if (!ok) return;
    await api.delete(`/banners/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/banners/${id}/restore`);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(banners.length / PAGE_SIZE));
  const pagedBanners = banners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Banners</h2>
        <button
          onClick={openAddModal}
          className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
        >
          + Add Banner
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Banner' : 'Add Banner'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
            <ImageUploadBox value={image} onChange={setImage} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md">
              {editingId ? 'Update Banner' : 'Add Banner'}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ActiveTabs active={activeTab} onChange={setActiveTab} />

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {pagedBanners.map((banner) => (
          <AdminMobileRow
            key={banner.id}
            image={banner.image}
            title={`Banner #${banner.id}`}
            onView={() => navigate(`/admin/banners/${banner.id}`)}
            actions={
              activeTab
                ? [
                    { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/banners/${banner.id}/edit`) },
                    { icon: faTrash, label: 'Delete', tone: 'danger', onClick: () => handleDelete(banner.id) },
                  ]
                : [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => handleRestore(banner.id) }]
            }
          />
        ))}
        {banners.length === 0 && <p className="p-4 text-gray-500 dark:text-gray-400">No banners found.</p>}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedBanners.map((banner) => (
              <tr key={banner.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3">
                  <img src={banner.image} alt={`Banner #${banner.id}`} className="w-32 h-16 object-cover rounded" />
                </td>
                <td className="p-3">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(banner)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(banner.id)}
                      aria-label="Restore"
                      title="Restore"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                    >
                      <FontAwesomeIcon icon={faRotateRight} size="xs" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {banners.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No banners found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
