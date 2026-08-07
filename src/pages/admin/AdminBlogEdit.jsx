import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import BlogForm from './forms/BlogForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findBlogById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/blogs?active=1'),
    api.get('/blogs?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((b) => String(b.id) === id);
}

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    findBlogById(id).then((blog) => {
      if (blog) setForm({ subject: blog.subject, message: blog.message, images: blog.images || [] });
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.subject.trim() || !form.message.trim()) {
      setError('Subject and message are required');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/blogs/${id}`, form);
      navigate(`/admin/blogs/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">Blog not found.</p>;

  return (
    <AdminDetailLayout title="Edit Blog">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <BlogForm form={form} setForm={setForm} />
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
