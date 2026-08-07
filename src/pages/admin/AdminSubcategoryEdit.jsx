import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import SubcategoryForm from './forms/SubcategoryForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findSubcategoryById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/subcategories?active=1'),
    api.get('/subcategories?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((s) => String(s.id) === id);
}

export default function AdminSubcategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const nameStatus = useDuplicateCheck('/subcategories/check-name', form?.name, {
    paramName: 'name',
    extraParams: { excludeId: id },
    skip: !form?.name,
  });

  useEffect(() => {
    Promise.all([findSubcategoryById(id), api.get('/categories')]).then(([subcategory, catRes]) => {
      setCategories(catRes.data);
      if (subcategory) {
        setForm({ name: subcategory.name, image: subcategory.image || '', category_id: subcategory.category_id });
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (nameStatus === 'duplicate') {
      setError('A subcategory with this name already exists');
      return;
    }
    if (!form.category_id) {
      setError('Please select a category');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/subcategories/${id}`, form);
      navigate(`/admin/subcategories/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">Subcategory not found.</p>;

  return (
    <AdminDetailLayout title="Edit Subcategory">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <SubcategoryForm form={form} setForm={setForm} categories={categories} nameStatus={nameStatus} />
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
