import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import RestockForm from './forms/RestockForm';
import LoadingBlock from '../../components/LoadingBlock';

export default function AdminLowStockEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockValue, setStockValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/products?lowStock=true').then((res) => {
      setProduct(res.data.find((p) => String(p.id) === id));
      setLoading(false);
    });
  }, [id]);

  const addedStock = Number(stockValue) || 0;
  const updatedStock = (product?.stock || 0) + addedStock;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.put(`/products/${id}`, { stock: updatedStock });
      navigate('/admin/low-stock');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!product) return <p className="text-gray-700 dark:text-gray-300">Product not found.</p>;

  return (
    <AdminDetailLayout title="Update Stock">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-3"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <RestockForm product={product} stockValue={stockValue} setStockValue={setStockValue} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-md"
          >
            {saving ? 'Saving...' : 'Save'}
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
