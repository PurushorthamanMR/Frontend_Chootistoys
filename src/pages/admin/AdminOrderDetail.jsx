import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import AdminDetailLayout from '../../components/AdminDetailLayout';
import DetailField from '../../components/DetailField';
import { STATUS_LABELS } from './forms/OrderStatusPanel';
import LoadingBlock from '../../components/LoadingBlock';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  successful: 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green',
  return: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then((res) => {
      setOrder(res.data.find((o) => String(o.id) === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <LoadingBlock className="py-16" />;
  if (!order) return <p className="text-gray-700 dark:text-gray-300">Order not found.</p>;

  return (
    <AdminDetailLayout title={`Order #${order.id}`}>
      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailField label="Customer" value={order.customer_name} />
          <DetailField label="Role" value={order.orderer_role} />
          <DetailField label="Contact" value={order.customer_phone} />
          <DetailField label="Date" value={new Date(order.created_at).toLocaleString()} />
          <DetailField
            label="Status"
            value={<span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[order.status]}`}>{STATUS_LABELS[order.status]}</span>}
          />
          <DetailField label="Total" value={formatRs(order.total_amount)} />
        </div>
        {order.shipping_address && <DetailField label="Shipping Address" value={order.shipping_address} />}

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Items</p>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {item.product_name}{item.product_code && ` (#${item.product_code})`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Qty {item.quantity}
                    {item.returned_quantity > 0 && ` · Returned ${item.returned_quantity}`} · {formatRs(item.price)} each
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  {formatRs(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => navigate(`/admin/orders/${id}/edit`)}
            className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold px-4 py-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20"
          >
            <FontAwesomeIcon icon={faPen} size="xs" /> Update Status / Return
          </button>
        </div>
      </div>
    </AdminDetailLayout>
  );
}
