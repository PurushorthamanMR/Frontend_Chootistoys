import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import Modal from '../../components/Modal';
import ActiveTabs from '../../components/ActiveTabs';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import ProductForm from './forms/ProductForm';

const PAGE_SIZE = 9;

const emptyForm = {
  name: '',
  product_code: '',
  description: '',
  purchase_price: '',
  sale_price: '',
  discount_percent: '',
  stock: '',
  image: '',
  category_id: '',
  subcategory_id: '',
  featured: false,
};

export default function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subcategoryFilter, setSubcategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const codeStatus = useDuplicateCheck('/products/check-code', form.product_code, {
    paramName: 'code',
    extraParams: { excludeId: editingId || undefined },
    skip: !form.product_code,
  });

  function load() {
    api.get(`/products?active=${activeTab ? '1' : '0'}`).then((res) => setProducts(res.data));
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/subcategories').then((res) => setSubcategories(res.data));
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
    if (codeStatus === 'duplicate') {
      setError('This product code is already in use');
      return;
    }
    const stockValue = Number(form.stock);
    if (!Number.isInteger(stockValue) || stockValue < 1) {
      setError('Stock must be a whole number of at least 1');
      return;
    }
    const payload = {
      ...form,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price),
      discount_percent: form.discount_percent === '' ? 0 : Number(form.discount_percent),
      stock: stockValue,
      category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
    };
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save product');
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      product_code: p.product_code || '',
      description: p.description || '',
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      discount_percent: p.discount_percent || '',
      stock: p.stock,
      image: p.image || '',
      category_id: p.category_id || '',
      subcategory_id: p.subcategory_id || '',
      featured: !!p.featured,
    });
    setError('');
    setModalOpen(true);
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this product?', text: 'It will be hidden from the store until restored.' });
    if (!ok) return;
    await api.delete(`/products/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/products/${id}/restore`);
    load();
  }

  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.name.toLowerCase().includes(q) || (p.product_code || '').toLowerCase().includes(q);
    const matchesCategory = !categoryFilter || String(p.category_id) === categoryFilter;
    const matchesSubcategory = !subcategoryFilter || String(p.subcategory_id) === subcategoryFilter;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const filterSubcategoryOptions = categoryFilter
    ? subcategories.filter((sc) => String(sc.category_id) === categoryFilter)
    : subcategories;

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, subcategoryFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Products</h2>
        <button
          onClick={openAddModal}
          className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
        >
          + Add Product
        </button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Product' : 'Add Product'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <ProductForm form={form} setForm={setForm} categories={categories} subcategories={subcategories} codeStatus={codeStatus} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={codeStatus === 'duplicate'}
              className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md"
            >
              {editingId ? 'Update Product' : 'Add Product'}
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

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search by name or code...">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setSubcategoryFilter(''); }}
          className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All subcategories</option>
          {filterSubcategoryOptions.map((sc) => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      </AdminFilterBar>

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {pagedProducts.map((p) => (
          <AdminMobileRow
            key={p.id}
            image={p.image}
            title={p.name}
            subtitle={[p.category_name, p.subcategory_name].filter(Boolean).join(' · ') || p.product_code}
            meta={
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  p.stock === 0
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
              </span>
            }
            onView={() => navigate(`/admin/products/${p.id}`)}
            actions={
              activeTab
                ? [
                    { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/products/${p.id}/edit`) },
                    { icon: faTrash, label: 'Delete', tone: 'danger', onClick: () => handleDelete(p.id) },
                  ]
                : [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => handleRestore(p.id) }]
            }
          />
        ))}
        {filteredProducts.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No products found.</p>
        )}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3">Purchase</th>
              <th className="p-3">Sale Price</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Final Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Category</th>
              <th className="p-3">Subcategory</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((p) => (
              <tr key={p.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3">
                  {p.image && <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" />}
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.product_code || '-'}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{formatRs(p.purchase_price)}</td>
                <td className="p-3">{formatRs(p.sale_price)}</td>
                <td className="p-3">
                  {Number(p.discount_percent) > 0 ? (
                    <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                      -{Number(p.discount_percent)}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3 text-wa-green-dark dark:text-wa-green font-semibold">{formatRs(p.discount_price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.category_name || '-'}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{p.subcategory_name || '-'}</td>
                <td className="p-3 whitespace-nowrap">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(p)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(p.id)}
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
        {filteredProducts.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No products found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
