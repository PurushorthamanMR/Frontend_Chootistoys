import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark, faPen, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import Modal from '../../components/Modal';
import AdminMobileRow from '../../components/AdminMobileRow';
import { confirmAction } from '../../lib/alert';
import { useDuplicateCheck } from '../../lib/useDuplicateCheck';
import { isValidEmail } from '../../lib/validators';
import UserForm from './forms/UserForm';
import LoadingBlock from '../../components/LoadingBlock';
import OtpInputModal from '../../components/OtpInputModal';
import FieldStatus from '../../components/FieldStatus';
import { successAlert } from '../../lib/alert';
import { useSettings } from '../../context/SettingsContext';

const ROLE_LABELS = {
  Seller: 'Seller',
  Admin: 'Admin',
  Staff: 'Staff',
};

const EMPTY_STAFF_FORM = { name: '', email: '', phone: '', password: '' };

const STATUS_TABS = ['pending', 'approved', 'rejected'];

const STATUS_STYLES = {
  approved: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

function StatusTabs({ status, onChange }) {
  return (
    <div className="flex gap-2 mb-4">
      {STATUS_TABS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize ${
            status === s
              ? 'bg-wa-green text-white'
              : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const posEnabled = !!settings?.pos_is_active;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusTab, setStatusTab] = useState('pending');
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', shop_name: '', city: '' });
  const [editError, setEditError] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffStep, setStaffStep] = useState('form');
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
  const [staffError, setStaffError] = useState('');
  const [savingStaff, setSavingStaff] = useState(false);

  const emailInvalid = !!editForm.email && !isValidEmail(editForm.email);
  const emailStatus = useDuplicateCheck('/users/check', editForm.email, {
    extraParams: { field: 'email', excludeId: editingUser?.id },
    skip: !editForm.email || emailInvalid,
  });
  const phoneStatus = useDuplicateCheck('/users/check', editForm.phone, {
    extraParams: { field: 'phone', excludeId: editingUser?.id },
    skip: !editForm.phone,
  });

  const staffEmailInvalid = !!staffForm.email && !isValidEmail(staffForm.email);
  const staffEmailStatus = useDuplicateCheck('/users/check', staffForm.email, {
    extraParams: { field: 'email' },
    skip: !staffForm.email || staffEmailInvalid,
  });
  const staffPhoneStatus = useDuplicateCheck('/users/check', staffForm.phone, {
    extraParams: { field: 'phone' },
    skip: !staffForm.phone,
  });

  function load() {
    setLoading(true);
    api
      .get(`/users?status=${statusTab}`)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusTab]);

  async function approve(id) {
    await api.put(`/users/${id}/approve`);
    load();
  }

  async function reject(id) {
    await api.put(`/users/${id}/reject`);
    load();
  }

  async function handleReject(id) {
    const ok = await confirmAction({ title: 'Reject this user?', text: 'They will no longer be able to log in until approved again.' });
    if (!ok) return;
    await reject(id);
  }

  function startEdit(u) {
    setEditingUser(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone || '', shop_name: u.shop_name || '', city: u.city || '' });
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
      setEditError('That phone number is already in use');
      return;
    }
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setEditingUser(null);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update user');
    }
  }

  function openAddStaff() {
    setStaffForm(EMPTY_STAFF_FORM);
    setStaffError('');
    setStaffStep('form');
    setAddingStaff(true);
  }

  async function handleAddStaffSubmit(e) {
    e.preventDefault();
    setStaffError('');
    if (staffEmailInvalid) {
      setStaffError('Enter a valid email address');
      return;
    }
    if (staffEmailStatus === 'duplicate') {
      setStaffError('That email is already in use');
      return;
    }
    if (staffPhoneStatus === 'duplicate') {
      setStaffError('That phone number is already in use');
      return;
    }
    setSavingStaff(true);
    try {
      await api.post('/users/staff/send-otp', staffForm);
      setStaffStep('otp');
    } catch (err) {
      setStaffError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSavingStaff(false);
    }
  }

  async function verifyAddStaffOtp(code) {
    const { data } = await api.post('/users/staff/verify-otp', { email: staffForm.email, code });
    return data;
  }

  function handleStaffVerified() {
    setAddingStaff(false);
    successAlert('Staff account created', 'A confirmation email has been sent to the staff member.');
    if (statusTab === 'approved') load();
  }

  if (loading) return <LoadingBlock className="py-16" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Users</h2>
        {/* POS must be switched on in Settings before new Staff/cashier
            accounts can be created - matches the backend's own gate on
            opening a shift/taking a sale, so this button doesn't offer an
            action that would just sit unusable. */}
        {posEnabled && (
          <button
            onClick={openAddStaff}
            className="bg-wa-green hover:bg-wa-green-dark text-white font-semibold px-4 py-2 rounded-md"
          >
            + Add Staff
          </button>
        )}
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <Modal open={addingStaff} onClose={() => setAddingStaff(false)} title="Add Staff (POS cashier)">
        {staffStep === 'otp' ? (
          <OtpInputModal
            identifier={staffForm.email}
            title="Verify staff email"
            onVerify={verifyAddStaffOtp}
            onResend={() => api.post('/users/staff/send-otp', staffForm)}
            onVerified={handleStaffVerified}
            onBack={() => setStaffStep('form')}
          />
        ) : (
          <form onSubmit={handleAddStaffSubmit} className="grid grid-cols-1 gap-3">
            {staffError && <p className="text-red-600 text-sm">{staffError}</p>}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Name</label>
              <input
                required
                value={staffForm.name}
                onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Email</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
              />
              <FieldStatus
                status={staffEmailStatus}
                duplicateMessage="That email is already in use"
                invalid={staffEmailInvalid}
                invalidMessage="Enter a valid email address"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                A verification code will be sent to this email before the account is created.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Phone (optional)</label>
              <input
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
              />
              <FieldStatus status={staffPhoneStatus} duplicateMessage="That phone number is already in use" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={staffForm.password}
                onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingStaff || staffEmailInvalid || staffEmailStatus === 'duplicate' || staffPhoneStatus === 'duplicate'}
                className="bg-wa-green hover:bg-wa-green-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-md"
              >
                {savingStaff ? 'Sending code...' : 'Send Verification Code'}
              </button>
              <button
                type="button"
                onClick={() => setAddingStaff(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      <StatusTabs status={statusTab} onChange={setStatusTab} />

      <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        <form onSubmit={handleEditSubmit} className="space-y-3">
          {editError && <p className="text-red-600 text-sm">{editError}</p>}
          <UserForm
            form={editForm}
            setForm={setEditForm}
            role={editingUser?.role}
            emailInvalid={emailInvalid}
            emailStatus={emailStatus}
            phoneStatus={phoneStatus}
          />
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
              onClick={() => setEditingUser(null)}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {users.map((u) => {
          const actions =
            statusTab === 'pending'
              ? [
                  { icon: faCheck, label: 'Approve', tone: 'success', onClick: () => approve(u.id) },
                  { icon: faXmark, label: 'Reject', tone: 'danger', onClick: () => reject(u.id) },
                ]
              : statusTab === 'rejected'
              ? [{ icon: faRotateRight, label: 'Restore', tone: 'success', onClick: () => approve(u.id) }]
              : [
                  { icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/users/${u.id}/edit`) },
                  { icon: faXmark, label: 'Reject', tone: 'danger', onClick: () => handleReject(u.id) },
                ];
          return (
            <AdminMobileRow
              key={u.id}
              image={null}
              title={u.name}
              subtitle={`${u.email} · ${ROLE_LABELS[u.role] || u.role}`}
              meta={
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[u.status]}`}>
                  {u.status}
                </span>
              }
              onView={() => navigate(`/admin/users/${u.id}`)}
              actions={actions}
            />
          );
        })}
        {users.length === 0 && <p className="p-4 text-gray-500 dark:text-gray-400">No {statusTab} users.</p>}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Shop</th>
              <th className="p-3">City</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{u.phone || '-'}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{u.shop_name || '-'}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400">{u.city || '-'}</td>
                <td className="p-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300">
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-gray-500 dark:text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {statusTab === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(u.id)}
                        aria-label="Approve"
                        title="Approve"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                      >
                        <FontAwesomeIcon icon={faCheck} size="xs" />
                      </button>
                      <button
                        onClick={() => reject(u.id)}
                        aria-label="Reject"
                        title="Reject"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faXmark} size="xs" />
                      </button>
                    </div>
                  ) : statusTab === 'rejected' ? (
                    <button
                      onClick={() => approve(u.id)}
                      aria-label="Restore"
                      title="Restore to approved"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green hover:bg-wa-green/20"
                    >
                      <FontAwesomeIcon icon={faRotateRight} size="xs" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        aria-label="Edit"
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <FontAwesomeIcon icon={faPen} size="xs" />
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        aria-label="Reject"
                        title="Reject"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                      >
                        <FontAwesomeIcon icon={faXmark} size="xs" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-gray-500 dark:text-gray-400">No {statusTab} users.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
