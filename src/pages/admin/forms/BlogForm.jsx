import ImageUploadBoxMulti from '../../../components/ImageUploadBoxMulti';

export default function BlogForm({ form, setForm }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Subject</label>
        <input
          type="text"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Message</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Images</label>
        <ImageUploadBoxMulti value={form.images} onChange={(images) => setForm({ ...form, images })} />
      </div>
    </div>
  );
}
