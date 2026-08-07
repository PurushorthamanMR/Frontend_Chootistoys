import { formatRs } from '../../../lib/format';
import ImageUploadBox from '../../../components/ImageUploadBox';
import FieldStatus from '../../../components/FieldStatus';

export default function ProductForm({ form, setForm, categories, subcategories, codeStatus }) {
  const formSubcategories = subcategories.filter((sc) => String(sc.category_id) === String(form.category_id));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input
        required
        placeholder="Product name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 sm:col-span-2"
      />
      <div className="sm:col-span-2">
        <input
          placeholder="Product Code (e.g. 1001)"
          value={form.product_code}
          onChange={(e) => setForm({ ...form, product_code: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
        <FieldStatus status={codeStatus} duplicateMessage="This product code is already in use" />
      </div>
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 sm:col-span-2"
        rows={2}
      />

      <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Purchase Price</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 2400"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Sale Price</label>
          <input
            required
            type="number"
            step="0.01"
            placeholder="e.g. 3650"
            value={form.sale_price}
            onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Discount %</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="e.g. 5"
            value={form.discount_percent}
            onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Stock</label>
          <input
            required
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 25"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
          />
        </div>
      </div>
      {form.sale_price && form.discount_percent > 0 && (
        <p className="sm:col-span-2 -mt-2 text-xs text-gray-500 dark:text-gray-400">
          Final price: {formatRs(Number(form.sale_price) - (Number(form.sale_price) * Number(form.discount_percent)) / 100)}
        </p>
      )}

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Category</label>
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value, subcategory_id: '' })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        >
          <option value="">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Subcategory</label>
        <select
          value={form.subcategory_id}
          disabled={!form.category_id}
          onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2 disabled:opacity-50"
        >
          <option value="">No subcategory</option>
          {formSubcategories.map((sc) => (
            <option key={sc.id} value={sc.id}>{sc.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
        <ImageUploadBox value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
      </div>

      <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
        Featured product
      </label>
    </div>
  );
}
