import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import { confirmAction, errorAlert } from '../../lib/alert';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import OrderStatusPanel, { STATUS_LABELS } from './forms/OrderStatusPanel';
import LoadingBlock from '../../components/LoadingBlock';

export default function AdminOrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusDraft, setStatusDraft] = useState('pending');
  const [returnQtys, setReturnQtys] = useState({});
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingReturn, setSavingReturn] = useState(false);

  function load() {
    setLoading(true);
    api.get('/orders').then((res) => {
      const found = res.data.find((o) => String(o.id) === id);
      setOrder(found);
      if (found) setStatusDraft(found.status);
      setLoading(false);
    });
  }

  useEffect(load, [id]);

  async function handleStatusSave() {
    if (statusDraft === order.status) return;
    const ok = await confirmAction({
      title: `Mark order #${order.id} as ${STATUS_LABELS[statusDraft]}?`,
      text:
        statusDraft === 'successful'
          ? 'This will reduce stock for the items in this order.'
          : order.status === 'successful'
          ? 'This will restore stock back to the catalog.'
          : undefined,
      confirmText: 'Yes, update',
      icon: 'question',
    });
    if (!ok) return;
    setSavingStatus(true);
    try {
      await api.put(`/orders/${order.id}/status`, { status: statusDraft });
      load();
    } catch (err) {
      errorAlert('Could not update status', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleReturnSave() {
    const items = Object.entries(returnQtys)
      .map(([itemId, qty]) => ({ id: Number(itemId), quantity: Number(qty) }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) return;
    const ok = await confirmAction({
      title: 'Process this return?',
      text: 'Stock will be restored and the order total will be adjusted.',
      confirmText: 'Yes, return',
      icon: 'question',
    });
    if (!ok) return;
    setSavingReturn(true);
    try {
      await api.put(`/orders/${order.id}/return`, { items });
      setReturnQtys({});
      load();
    } catch (err) {
      errorAlert('Could not process return', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSavingReturn(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;
  if (!order) return <p className="text-gray-700 dark:text-gray-300">Order not found.</p>;

  return (
    <AdminDetailLayout title={`Order #${order.id}`}>
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6">
        <OrderStatusPanel
          order={order}
          statusDraft={statusDraft}
          setStatusDraft={setStatusDraft}
          onStatusSave={handleStatusSave}
          savingStatus={savingStatus}
          returnQtys={returnQtys}
          setReturnQtys={setReturnQtys}
          onReturnSave={handleReturnSave}
          savingReturn={savingReturn}
        />
        <button
          type="button"
          onClick={() => navigate(`/admin/orders/${id}`)}
          className="mt-4 px-4 py-2 rounded-md border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
        >
          Back to Details
        </button>
      </div>
    </AdminDetailLayout>
  );
}
