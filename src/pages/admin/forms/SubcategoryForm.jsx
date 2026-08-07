import ImageUploadBox from '../../../components/ImageUploadBox';
import FieldStatus from '../../../components/FieldStatus';

export default function SubcategoryForm({ form, setForm, categories, nameStatus }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Category</label>
        <select
          required
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <input
          required
          placeholder="Subcategory name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
        <FieldStatus status={nameStatus} duplicateMessage="A subcategory with this name already exists" />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
        <ImageUploadBox value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
      </div>
    </div>
  );
}
