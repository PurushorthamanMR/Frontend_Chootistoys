import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import ActiveTabs from '../../components/ActiveTabs';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';
import BlogForm from './forms/BlogForm';

const PAGE_SIZE = 9;

const emptyForm = { subject: '', message: '', images: [] };

export default function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(true);
  const [page, setPage] = useState(1);

  function load() {
    api.get(`/blogs?active=${activeTab ? '1' : '0'}`).then((res) => setBlogs(res.data));
  }

  useEffect(load, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

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
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Subject and message are required');
      return;
    }
    try {
      if (editingId) {
        await api.put(`/blogs/${editingId}`, form);
      } else {
        await api.post('/blogs', form);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save blog');
    }
  }

  function startEdit(blog) {
    setEditingId(blog.id);
    setForm({ subject: blog.subject, message: blog.message, images: blog.images || [] });
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this blog?', text: 'It will be hidden from the Blogs page until restored.' });
    if (!ok) return;
    await api.delete(`/blogs/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/blogs/${id}/restore`);
    load();
  }

  const totalPages = Math.max(1, Math.ceil(blogs.length / PAGE_SIZE));
  const pagedBlogs = blogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Blogs</h2>
        <button
          onClick={openAddModal}
          className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
        >
          + Add Blog
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Blog' : 'Add Blog'}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <BlogForm form={form} setForm={setForm} />
          <div className="flex gap-2">
            <button type="submit" className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md">
              {editingId ? 'Update Blog' : 'Add Blog'}
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
        {pagedBlogs.map((blog) => (
          <AdminMobileRow
            key={blog.id}
            image={(blog.images || [])[0]}
            title={blog.subject}
            subtitle={blog.message}
            onView={() => navigate(`/admin/blogs/${blog.id}`)}
            actions={
              activeTab
                ? [
                    { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/blogs/${blog.id}/edit`) },
                    { icon: faTrash, label: 'Delete', tone: 'danger', onClick: () => handleDelete(blog.id) },
                  ]
                : [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => handleRestore(blog.id) }]
            }
          />
        ))}
        {blogs.length === 0 && <p className="p-4 text-gray-500 dark:text-gray-400">No blogs found.</p>}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Images</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Message</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedBlogs.map((blog) => (
              <tr key={blog.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200 align-top">
                <td className="p-3">
                  <div className="flex gap-1 flex-wrap max-w-[9rem]">
                    {(blog.images || []).length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-600 text-xs">No images</span>
                    ) : (
                      blog.images.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} alt={`${blog.subject} ${i + 1}`} className="w-10 h-10 object-cover rounded" />
                      ))
                    )}
                    {(blog.images || []).length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                        +{blog.images.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 font-semibold max-w-xs">{blog.subject}</td>
                <td className="p-3 max-w-sm">
                  <p className="line-clamp-2 text-gray-600 dark:text-gray-400">{blog.message}</p>
                </td>
                <td className="p-3">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(blog)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(blog.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(blog.id)}
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
        {blogs.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No blogs found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
