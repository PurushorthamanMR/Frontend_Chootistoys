import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import ProductForm from './forms/ProductForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findProductById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/products?active=1'),
    api.get('/products?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((p) => String(p.id) === id);
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const codeStatus = useDuplicateCheck('/products/check-code', form?.product_code, {
    paramName: 'code',
    extraParams: { excludeId: id },
    skip: !form?.product_code,
  });

  useEffect(() => {
    Promise.all([findProductById(id), api.get('/categories'), api.get('/subcategories')]).then(
      ([product, catRes, subRes]) => {
        setCategories(catRes.data);
        setSubcategories(subRes.data);
        if (product) {
          setForm({
            name: product.name,
            product_code: product.product_code || '',
            description: product.description || '',
            purchase_price: product.purchase_price,
            sale_price: product.sale_price,
            discount_percent: product.discount_percent || '',
            stock: product.stock,
            image: product.image || '',
            category_id: product.category_id || '',
            subcategory_id: product.subcategory_id || '',
            featured: !!product.featured,
          });
        }
        setLoading(false);
      }
    );
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (codeStatus === 'duplicate') {
      setError('This product code is already in use');
      return;
    }
    const stockValue = Number(form.stock);
    if (!Number.isInteger(stockValue) || stockValue < 1) {
      setError('Stock must be a whole number of at least 1');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/products/${id}`, {
        ...form,
        purchase_price: Number(form.purchase_price) || 0,
        sale_price: Number(form.sale_price),
        discount_percent: form.discount_percent === '' ? 0 : Number(form.discount_percent),
        stock: stockValue,
        category_id: form.category_id || null,
        subcategory_id: form.subcategory_id || null,
      });
      navigate(`/admin/products/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">Product not found.</p>;

  return (
    <AdminDetailLayout title="Edit Product">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <ProductForm form={form} setForm={setForm} categories={categories} subcategories={subcategories} codeStatus={codeStatus} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || codeStatus === 'duplicate'}
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
