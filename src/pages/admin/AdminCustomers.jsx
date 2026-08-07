import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import ActiveTabs from '../../components/ActiveTabs';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import { isValidEmail } from '../../lib/validators';
import CustomerForm from './forms/CustomerForm';
import LoadingBlock from '../../components/LoadingBlock';

const PAGE_SIZE = 10;

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [editError, setEditError] = useState('');

  const emailInvalid = !!editForm.email && !isValidEmail(editForm.email);
  const emailStatus = useDuplicateCheck('/customers/check', editForm.email, {
    extraParams: { field: 'email', excludeId: editingCustomer?.id },
    skip: !editForm.email || emailInvalid,
  });
  const phoneStatus = useDuplicateCheck('/customers/check', editForm.phone, {
    extraParams: { field: 'phone', excludeId: editingCustomer?.id },
    skip: !editForm.phone,
  });

  function load() {
    setLoading(true);
    api
      .get(`/customers?active=${activeTab ? '1' : '0'}`)
      .then((res) => setCustomers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load customers'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  function startEdit(customer) {
    setEditingCustomer(customer);
    setEditForm({ name: customer.name, email: customer.email || '', phone: customer.phone || '' });
    setEditError('');
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditError('');
    if (emailInvalid) {
      setEditError('Enter a valid email address');
      return;
    }
    if (emailStatus === 'duplicate') {
      setEditError('That email is already in use');
      return;
    }
    if (phoneStatus === 'duplicate') {
      setEditError('That WhatsApp number is already in use');
      return;
    }
    try {
      await api.put(`/customers/${editingCustomer.id}`, editForm);
      setEditingCustomer(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update customer');
    }
  }

  async function handleDelete(id) {
    const ok = await confirmAction({ title: 'Deactivate this customer?', text: 'They will no longer be able to log in until restored.' });
    if (!ok) return;
    await api.delete(`/customers/${id}`);
    load();
  }

  async function handleRestore(id) {
    await api.put(`/customers/${id}/restore`);
    load();
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const pagedCustomers = filteredCustomers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) return <LoadingBlock className="py-16" />;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Customers</h2>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <Modal open={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Edit Customer">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          {editError && <p className="text-red-600 text-sm">{editError}</p>}
          <CustomerForm form={editForm} setForm={setEditForm} emailInvalid={emailInvalid} emailStatus={emailStatus} phoneStatus={phoneStatus} />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={emailInvalid || emailStatus === 'duplicate' || phoneStatus === 'duplicate'}
              className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <ActiveTabs active={activeTab} onChange={setActiveTab} />

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search customers..." />

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {pagedCustomers.map((c) => (
          <AdminMobileRow
            key={c.id}
            image={null}
            title={c.name}
            subtitle={c.phone}
            onView={() => navigate(`/admin/customers/${c.id}`)}
            actions={
              activeTab
                ? [
                    { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/customers/${c.id}/edit`) },
                    { icon: faTrash, label: 'Delete', tone: 'danger', onClick: () => handleDelete(c.id) },
                  ]
                : [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => handleRestore(c.id) }]
            }
          />
        ))}
        {filteredCustomers.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No {activeTab ? 'active' : 'inactive'} customers.</p>
        )}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">WhatsApp Number</th>
              <th className="p-3">Email</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedCustomers.map((c) => (
              <tr key={c.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{c.email || '-'}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {activeTab ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        aria-label="Delete"
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faTrash} size="xs" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(c.id)}
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
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-500 dark:text-gray-400">No {activeTab ? 'active' : 'inactive'} customers.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
