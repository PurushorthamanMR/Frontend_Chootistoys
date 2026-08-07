import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import { isValidEmail } from '../../lib/validators';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import UserForm from './forms/UserForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findUserById(id) {
  const [pending, approved, rejected] = await Promise.all([
    api.get('/users?status=pending'),
    api.get('/users?status=approved'),
    api.get('/users?status=rejected'),
  ]);
  return [...pending.data, ...approved.data, ...rejected.data].find((u) => String(u.id) === id);
}

export default function AdminUserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const emailInvalid = !!form?.email && !isValidEmail(form.email);
  const emailStatus = useDuplicateCheck('/users/check', form?.email, {
    extraParams: { field: 'email', excludeId: id },
    skip: !form?.email || emailInvalid,
  });
  const phoneStatus = useDuplicateCheck('/users/check', form?.phone, {
    extraParams: { field: 'phone', excludeId: id },
    skip: !form?.phone,
  });

  useEffect(() => {
    findUserById(id).then((user) => {
      if (user) {
        setRole(user.role);
        setForm({ name: user.name, email: user.email, phone: user.phone || '', shop_name: user.shop_name || '', city: user.city || '' });
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (emailInvalid) {
      setError('Enter a valid email address');
      return;
    }
    if (emailStatus === 'duplicate') {
      setError('That email is already in use');
      return;
    }
    if (phoneStatus === 'duplicate') {
      setError('That phone number is already in use');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/users/${id}`, form);
      navigate(`/admin/users/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">User not found.</p>;

  return (
    <AdminDetailLayout title="Edit User">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <UserForm form={form} setForm={setForm} role={role} emailInvalid={emailInvalid} emailStatus={emailStatus} phoneStatus={phoneStatus} />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || emailInvalid || emailStatus === 'duplicate' || phoneStatus === 'duplicate'}
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
