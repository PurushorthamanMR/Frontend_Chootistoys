import ImageUploadBox from '../../../components/ImageUploadBox';
import FieldStatus from '../../../components/FieldStatus';

export default function CategoryForm({ form, setForm, nameStatus }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <input
          required
          placeholder="Category name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
        <FieldStatus status={nameStatus} duplicateMessage="A category with this name already exists" />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Image</label>
        <ImageUploadBox value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
      </div>
    </div>
  );
}
