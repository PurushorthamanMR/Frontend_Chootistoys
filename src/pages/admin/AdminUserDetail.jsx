import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck, faXmark, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { confirmAction } from '../../lib/alert';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import DetailField from '../../components/DetailField';
import LoadingBlock from '../../components/LoadingBlock';

const STATUS_STYLES = {
  approved: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

async function findUserById(id) {
  const [pending, approved, rejected] = await Promise.all([
    api.get('/users?status=pending'),
    api.get('/users?status=approved'),
    api.get('/users?status=rejected'),
  ]);
  return [...pending.data, ...approved.data, ...rejected.data].find((u) => String(u.id) === id);
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    findUserById(id).then(setUser).finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleApprove() {
    await api.put(`/users/${id}/approve`);
    load();
  }

  async function handleReject() {
    const ok = await confirmAction({ title: 'Reject this user?', text: 'They will no longer be able to log in until approved again.' });
    if (!ok) return;
    await api.put(`/users/${id}/reject`);
    load();
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!user) return <p className="text-gray-700 dark:text-gray-300">User not found.</p>;

  return (
    <AdminDetailLayout title="User Details">
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Name" value={user.name} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Phone" value={user.phone} />
          <DetailField label="Role" value={user.role} />
          {user.role === 'Seller' && (
            <>
              <DetailField label="Shop Name" value={user.shop_name} />
              <DetailField label="City" value={user.city} />
            </>
          )}
          <DetailField
            label="Status"
            value={<span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[user.status]}`}>{user.status}</span>}
          />
          <DetailField label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
        </div>

        <div className="flex gap-2 pt-2">
          {user.status === 'pending' ? (
            <>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 bg-wa-green/10 text-wa-green-dark dark:text-wa-green font-semibold px-4 py-2 rounded-md hover:bg-wa-green/20"
              >
                <FontAwesomeIcon icon={faCheck} size="xs" /> Approve
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <FontAwesomeIcon icon={faXmark} size="xs" /> Reject
              </button>
            </>
          ) : user.status === 'rejected' ? (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 bg-wa-green/10 text-wa-green-dark dark:text-wa-green font-semibold px-4 py-2 rounded-md hover:bg-wa-green/20"
            >
              <FontAwesomeIcon icon={faRotateRight} size="xs" /> Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate(`/admin/users/${id}/edit`)}
                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20"
              >
                <FontAwesomeIcon icon={faPen} size="xs" /> Edit
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold px-4 py-2 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <FontAwesomeIcon icon={faXmark} size="xs" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </AdminDetailLayout>
  );
}
