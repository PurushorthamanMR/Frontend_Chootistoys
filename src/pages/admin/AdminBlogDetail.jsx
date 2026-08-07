import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { confirmAction } from '../../lib/alert';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import LoadingBlock from '../../components/LoadingBlock';

async function findBlogById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/blogs?active=1'),
    api.get('/blogs?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((b) => String(b.id) === id);
}

export default function AdminBlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findBlogById(id).then(setBlog).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const ok = await confirmAction({ title: 'Deactivate this blog?', text: 'It will be hidden from the Blogs page until restored.' });
    if (!ok) return;
    await api.delete(`/blogs/${id}`);
    navigate('/admin/blogs');
  }

  async function handleRestore() {
    await api.put(`/blogs/${id}/restore`);
    setBlog((b) => ({ ...b, is_active: 1 }));
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!blog) return <p className="text-gray-700 dark:text-gray-300">Blog not found.</p>;

  return (
    <AdminDetailLayout title="Blog Details">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
        {(blog.images || []).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {blog.images.map((img, i) => (
              <img key={i} src={img} alt={`${blog.subject} ${i + 1}`} className="w-24 h-24 object-cover rounded-lg" />
            ))}
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Subject</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{blog.subject}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Message</p>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{blog.message}</p>
        </div>

        <div className="flex gap-2 pt-2">
          {blog.is_active ? (
            <>
              <button
                onClick={() => navigate(`/admin/blogs/${id}/edit`)}
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
