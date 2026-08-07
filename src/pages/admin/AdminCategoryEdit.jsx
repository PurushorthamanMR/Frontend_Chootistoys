import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import CategoryForm from './forms/CategoryForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findCategoryById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/categories?active=1'),
    api.get('/categories?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((c) => String(c.id) === id);
}

export default function AdminCategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const nameStatus = useDuplicateCheck('/categories/check-name', form?.name, {
    paramName: 'name',
    extraParams: { excludeId: id },
    skip: !form?.name,
  });

  useEffect(() => {
    findCategoryById(id).then((category) => {
      if (category) setForm({ name: category.name, image: category.image || '' });
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (nameStatus === 'duplicate') {
      setError('A category with this name already exists');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/categories/${id}`, form);
      navigate(`/admin/categories/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">Category not found.</p>;

  return (
    <AdminDetailLayout title="Edit Category">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <CategoryForm form={form} setForm={setForm} nameStatus={nameStatus} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || nameStatus === 'duplicate'}
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
