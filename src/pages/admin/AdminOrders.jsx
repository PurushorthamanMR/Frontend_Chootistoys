import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import { confirmAction, errorAlert } from '../../lib/alert';
import AdminFilterBar from '../../components/AdminFilterBar';
import Pagination from '../../components/Pagination';
import AdminMobileRow from '../../components/AdminMobileRow';
import Modal from '../../components/Modal';
import OrderStatusPanel, { STATUS_LABELS } from './forms/OrderStatusPanel';
import LoadingBlock from '../../components/LoadingBlock';

const PAGE_SIZE = 9;

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  successful: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'successful', label: 'Approved' },
  { key: 'cancelled', label: 'Cancel' },
  { key: 'return', label: 'Return' },
];

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusDraft, setStatusDraft] = useState('pending');
  const [returnQtys, setReturnQtys] = useState({});
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingReturn, setSavingReturn] = useState(false);
  const [statusTab, setStatusTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  function load() {
    api.get('/orders').then((res) => setOrders(res.data)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusTab]);

  function openEdit(order) {
    setEditingOrder(order);
    setStatusDraft(order.status);
    setReturnQtys({});
  }

  function closeEdit() {
    setEditingOrder(null);
  }

  async function handleStatusSave() {
    if (statusDraft === editingOrder.status) {
      closeEdit();
      return;
    }
    const ok = await confirmAction({
      title: `Mark order #${editingOrder.id} as ${STATUS_LABELS[statusDraft]}?`,
      text:
        statusDraft === 'successful'
          ? 'This will reduce stock for the items in this order.'
          : editingOrder.status === 'successful'
          ? 'This will restore stock back to the catalog.'
          : undefined,
      confirmText: 'Yes, update',
      icon: 'question',
    });
    if (!ok) return;
    setSavingStatus(true);
    try {
      await api.put(`/orders/${editingOrder.id}/status`, { status: statusDraft });
      closeEdit();
      load();
    } catch (err) {
      errorAlert('Could not update status', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleReturnSave() {
    const items = Object.entries(returnQtys)
      .map(([id, qty]) => ({ id: Number(id), quantity: Number(qty) }))
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
      await api.put(`/orders/${editingOrder.id}/return`, { items });
      closeEdit();
      load();
    } catch (err) {
      errorAlert('Could not process return', err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSavingReturn(false);
    }
  }

  if (loading) return <LoadingBlock className="py-16" />;

  const q = search.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    if (o.status !== statusTab) return false;
    if (!q) return true;
    return String(o.id).includes(q) || (o.customer_name || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Orders</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_TABS.map((tab) => {
          const count = orders.filter((o) => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold ${
                statusTab === tab.key
                  ? 'bg-wa-green text-white'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <AdminFilterBar search={search} onSearchChange={setSearch} placeholder="Search by order # or customer..." />

      <div className="xl:hidden bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none px-3">
        {pagedOrders.map((order) => (
          <AdminMobileRow
            key={order.id}
            image={null}
            title={`Order #${order.id}`}
            subtitle={`${order.customer_name} · ${new Date(order.created_at).toLocaleDateString()}`}
            meta={
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{formatRs(order.total_amount)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            }
            onView={() => navigate(`/admin/orders/${order.id}`)}
            actions={[{ icon: faPen, label: 'Edit', tone: 'edit', onClick: () => navigate(`/admin/orders/${order.id}/edit`) }]}
          />
        ))}
        {filteredOrders.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No {statusTab} orders found.</p>
        )}
      </div>

      <div className="hidden xl:block bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Role</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order) => (
              <tr key={order.id} className="border-t border-gray-200 dark:border-neutral-800 align-top text-gray-800 dark:text-gray-200">
                <td className="p-3 font-semibold whitespace-nowrap">#{order.id}</td>
                <td className="p-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <p className="font-medium">{order.customer_name}</p>
                  {order.shipping_phone && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.shipping_name}{order.shipping_address ? `, ${order.shipping_address}` : ''} ({order.shipping_phone})
                    </p>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{order.orderer_role}</td>
                <td className="p-3 min-w-[220px]">
                  <ul className="space-y-0.5">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-4 text-xs">
                        <span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {item.product_code || '-'}
                          </span>{' '}
                          x{item.quantity}
                          {item.returned_quantity > 0 && (
                            <span className="text-orange-500 dark:text-orange-400"> (returned {item.returned_quantity})</span>
                          )}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {formatRs(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="p-3 font-bold whitespace-nowrap">{formatRs(order.total_amount)}</td>
                <td className="p-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => openEdit(order)}
                    aria-label="Edit order"
                    title="Edit order"
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
                  >
                    <FontAwesomeIcon icon={faPen} size="xs" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <p className="p-4 text-gray-500 dark:text-gray-400">No {statusTab} orders found.</p>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!editingOrder} onClose={closeEdit} title={editingOrder ? `Order #${editingOrder.id}` : ''} maxWidth="max-w-xl">
        {editingOrder && (
          <OrderStatusPanel
            order={editingOrder}
            statusDraft={statusDraft}
            setStatusDraft={setStatusDraft}
            onStatusSave={handleStatusSave}
            savingStatus={savingStatus}
            returnQtys={returnQtys}
            setReturnQtys={setReturnQtys}
            onReturnSave={handleReturnSave}
            savingReturn={savingReturn}
          />
        )}
      </Modal>
    </div>
  );
}
