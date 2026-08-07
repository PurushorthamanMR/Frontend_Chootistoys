import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import { confirmAction } from '../../lib/alert';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import DetailField from '../../components/DetailField';
import LoadingBlock from '../../components/LoadingBlock';

async function findProductById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/products?active=1'),
    api.get('/products?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((p) => String(p.id) === id);
}

export default function AdminProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    findProductById(id).then(setProduct).finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    const ok = await confirmAction({ title: 'Deactivate this product?', text: 'It will be hidden from the store until restored.' });
    if (!ok) return;
    await api.delete(`/products/${id}`);
    navigate('/admin/products');
  }

  async function handleRestore() {
    await api.put(`/products/${id}/restore`);
    setProduct((p) => ({ ...p, is_active: 1 }));
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!product) return <p className="text-gray-700 dark:text-gray-300">Product not found.</p>;

  return (
    <AdminDetailLayout title="Product Details">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
        {product.image && (
          <img src={product.image} alt={product.name} className="w-full max-h-64 object-cover rounded-lg" />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Name" value={product.name} />
          <DetailField label="Product Code" value={product.product_code} />
          <DetailField label="Purchase Price" value={formatRs(product.purchase_price)} />
          <DetailField label="Sale Price" value={formatRs(product.sale_price)} />
          <DetailField label="Discount" value={Number(product.discount_percent) > 0 ? `${Number(product.discount_percent)}%` : '-'} />
          <DetailField label="Final Price" value={formatRs(product.discount_price)} />
          <DetailField label="Stock" value={product.stock} />
          <DetailField label="Category" value={product.category_name} />
          <DetailField label="Subcategory" value={product.subcategory_name} />
          <DetailField label="Featured" value={product.featured ? 'Yes' : 'No'} />
          <DetailField label="Status" value={product.is_active ? 'Active' : 'Inactive'} />
        </div>
        {product.description && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">Description</p>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {product.is_active ? (
            <>
              <button
                onClick={() => navigate(`/admin/products/${id}/edit`)}
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
