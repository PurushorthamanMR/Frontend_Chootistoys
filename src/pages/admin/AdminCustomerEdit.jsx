import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import { isValidEmail } from '../../lib/validators';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import CustomerForm from './forms/CustomerForm';
import LoadingBlock from '../../components/LoadingBlock';

async function findCustomerById(id) {
  const [active, inactive] = await Promise.all([
    api.get('/customers?active=1'),
    api.get('/customers?active=0'),
  ]);
  return [...active.data, ...inactive.data].find((c) => String(c.id) === id);
}

export default function AdminCustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const emailInvalid = !!form?.email && !isValidEmail(form.email);
  const emailStatus = useDuplicateCheck('/customers/check', form?.email, {
    extraParams: { field: 'email', excludeId: id },
    skip: !form?.email || emailInvalid,
  });
  const phoneStatus = useDuplicateCheck('/customers/check', form?.phone, {
    extraParams: { field: 'phone', excludeId: id },
    skip: !form?.phone,
  });

  useEffect(() => {
    findCustomerById(id).then((customer) => {
      if (customer) setForm({ name: customer.name, email: customer.email || '', phone: customer.phone || '' });
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
      setError('That WhatsApp number is already in use');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/customers/${id}`, form);
      navigate(`/admin/customers/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!form) return <p className="text-gray-700 dark:text-gray-300">Customer not found.</p>;

  return (
    <AdminDetailLayout title="Edit Customer">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-4"
      >
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <CustomerForm form={form} setForm={setForm} emailInvalid={emailInvalid} emailStatus={emailStatus} phoneStatus={phoneStatus} />
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
