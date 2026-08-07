import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import ActiveTabs from '../../components/ActiveTabs';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import CategoryForm from './forms/CategoryForm';

const PAGE_SIZE = 9;

const emptyForm = { name: '', image: '' };

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const nameStatus = useDuplicateCheck('/categories/check-name', form.name, {
    paramName: 'name',
    extraParams: { excludeId: editingId || undefined },
    skip: !form.name,
  });

  function load() {
    api.get(`/categories?active=${activeTab ? '1' : '0'}`).then((res) => setCategories(res.data));
  }

  useEffect(load, [activeTab]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (nameStatus === 'duplicate') {
      setError('A category with this name already exists');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  }

  function startEdit(cat) {
    setEditingId(cat.id);
    setForm({ name: cat.name, image: cat.image || '' });
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this category?', text: 'It will be hidden from the store until restored.' });
    if (!ok) return;
    await api.delete(`/categories/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/categories/${id}/restore`);
    load();
  }

  const filteredCategories = categories.filter((cat) => {
    const q = search.trim().toLowerCase();
    return !q || cat.name.toLowerCase().includes(q) || cat.slug.toLowerCase().includes(q);
  });

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const pagedCategories = filteredCategories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Categories</h2>
        <button
          onClick={openAddModal}
          className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
        >
          + Add Category
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <CategoryForm form={form} setForm={setForm} nameStatus={nameStatus} />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={nameStatus === 'duplicate'}
              className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md"
            >
              {editingId ? 'Update Category' : 'Add Category'}
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

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search categories..." />

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {pagedCategories.map((cat) => (
          <AdminMobileRow
            key={cat.id}
            image={cat.image}
            title={cat.name}
            subtitle={cat.slug}
            onView={() => navigate(`/admin/categories/${cat.id}`)}
            actions={
              activeTab
                ? [
                    { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/categories/${cat.id}/edit`) },
                    { icon: faTrash, label: 'Delete', tone: 'danger', onClick: () => handleDelete(cat.id) },
                  ]
                : [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => handleRestore(cat.id) }]
            }
          />
        ))}
        {filteredCategories.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No categories found.</p>
        )}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCategories.map((cat) => (
              <tr key={cat.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3">
                  {cat.image && <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover rounded" />}
                </td>
                <td className="p-3 font-medium">{cat.name}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{cat.slug}</td>
                <td className="p-3">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(cat)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(cat.id)}
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
        {filteredCategories.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No categories found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
