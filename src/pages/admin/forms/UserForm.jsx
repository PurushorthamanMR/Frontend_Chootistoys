import FieldStatus from '../../../components/FieldStatus';

export default function UserForm({ form, setForm, role, emailInvalid, emailStatus, phoneStatus }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Name</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
        <FieldStatus
          status={emailStatus}
          duplicateMessage="That email is already in use"
          invalid={emailInvalid}
          invalidMessage="Enter a valid email address"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Phone</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
        <FieldStatus status={phoneStatus} duplicateMessage="That phone number is already in use" />
      </div>
      {role === 'Seller' && (
        <>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Shop Name</label>
            <input
              value={form.shop_name}
              onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
            />
          </div>
        </>
      )}
    </div>
  );
}
