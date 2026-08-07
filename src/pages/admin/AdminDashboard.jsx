import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faReceipt, faBox, faUsers, faCubes } from '@fortawesome/free-solid-svg-icons';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../api/client';
import { formatRs } from '../../lib/format';
import LoadingBlock from '../../components/LoadingBlock';

// "successful" tracks the site's configured accent color; the rest are fixed
// semantic colors (warning/danger) that shouldn't shift with the theme.
const STATUS_COLORS = {
  pending: '#eab308',
  successful: 'var(--color-wa-green)',
  return: '#f97316',
  cancelled: '#ef4444',
};

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-wa-green/10 text-wa-green-dark dark:text-wa-green flex items-center justify-center text-lg shrink-0">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, empty, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4">
      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{title}</h3>
      {empty ? <p className="text-sm text-gray-500 dark:text-gray-400">Not enough data yet.</p> : children}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sellerStats, setSellerStats] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/dashboard').then((res) => setStats(res.data)).finally(() => setLoading(false));
    api.get('/analytics/seller-sales').then((res) => setSellerStats(res.data)).finally(() => setSellerLoading(false));
  }, []);

  const revenueData = (stats?.revenueByDay || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }),
    revenue: Number(d.revenue),
  }));

  const topProductsData = (stats?.topProducts || []).map((p) => ({
    name: p.name.length > 16 ? `${p.name.slice(0, 16)}…` : p.name,
    sold: Number(p.total_sold),
  }));

  const topCategoriesData = (stats?.topCategories || []).map((c) => ({
    name: c.name,
    sold: Number(c.total_sold),
  }));

  const maxStatusCount = Math.max(1, ...(stats?.statusBreakdown || []).map((s) => s.count));

  const sellerCostByDayData = (sellerStats?.costByDay || []).map((d) => ({
    day: new Date(d.day).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' }),
    cost: Number(d.cost),
  }));

  const sellerTopProductsData = (sellerStats?.topProducts || []).map((p) => ({
    name: p.name.length > 16 ? `${p.name.slice(0, 16)}…` : p.name,
    sold: Number(p.total_sold),
  }));

  const sellerMaxStatusCount = Math.max(1, ...(sellerStats?.statusBreakdown || []).map((s) => s.count));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h2>

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 pt-1">Customer Analysis</h3>

      {loading ? (
        <LoadingBlock className="py-6" />
      ) : !stats ? (
        <p className="text-gray-500 dark:text-gray-400">Failed to load dashboard.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={faCoins} label="Revenue (successful orders)" value={formatRs(stats.revenue)} />
            <StatCard icon={faReceipt} label="Total Orders" value={stats.orderCount} />
            <StatCard icon={faBox} label="Active Products" value={stats.productCount} />
            <StatCard icon={faUsers} label="Customers" value={stats.customerCount} />
          </div>

          <ChartCard title="Revenue - last 30 days" empty={revenueData.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatRs(v)} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-wa-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Top Products (all-time)" empty={topProductsData.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="var(--color-wa-green)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Top Categories" empty={topCategoriesData.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topCategoriesData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="var(--color-wa-teal-light)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Orders by Status</h3>
              <div className="space-y-2">
                {stats.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-20 text-xs capitalize text-gray-600 dark:text-gray-400">{s.status}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.count / maxStatusCount) * 100}%`,
                          backgroundColor: STATUS_COLORS[s.status] || '#9ca3af',
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">{s.count}</span>
                  </div>
                ))}
                {stats.statusBreakdown.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4 overflow-x-auto">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Recent Orders</h3>
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                      <td className="py-1.5">#{o.id}</td>
                      <td className="py-1.5">{o.customer_name}</td>
                      <td className="py-1.5">{formatRs(o.total_amount)}</td>
                      <td className="py-1.5 capitalize">{o.status}</td>
                    </tr>
                  ))}
                  {stats.recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3 text-gray-500 dark:text-gray-400">No orders yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 pt-2">Seller Analysis</h3>

      {sellerLoading ? (
        <LoadingBlock className="py-6" />
      ) : !sellerStats ? (
        <p className="text-gray-500 dark:text-gray-400">Failed to load seller analysis.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={faCoins} label="Total Cost (successful orders)" value={formatRs(sellerStats.totalCost)} />
            <StatCard icon={faReceipt} label="Successful Orders" value={sellerStats.orderCount} />
            <StatCard icon={faCubes} label="Units Sold" value={sellerStats.unitsSold} />
            <StatCard icon={faBox} label="Active Products" value={sellerStats.productCount} />
          </div>

          <ChartCard title="Seller Cost - last 30 days" empty={sellerCostByDayData.length === 0}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={sellerCostByDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatRs(v)} />
                <Line type="monotone" dataKey="cost" stroke="var(--color-wa-green)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Seller Top Products by Units Sold" empty={sellerTopProductsData.length === 0}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sellerTopProductsData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af33" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="sold" fill="var(--color-wa-green)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Seller Orders by Status</h3>
              <div className="space-y-2">
                {sellerStats.statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-3">
                    <span className="w-20 text-xs capitalize text-gray-600 dark:text-gray-400">{s.status}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.count / sellerMaxStatusCount) * 100}%`,
                          backgroundColor: STATUS_COLORS[s.status] || '#9ca3af',
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">{s.count}</span>
                  </div>
                ))}
                {sellerStats.statusBreakdown.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No orders yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4 overflow-x-auto">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Seller Top Products (Cost Basis)</h3>
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Units Sold</th>
                  <th className="pb-2">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {sellerStats.topProducts.map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5">{p.total_sold}</td>
                    <td className="py-1.5">{formatRs(p.total_cost)}</td>
                  </tr>
                ))}
                {sellerStats.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-gray-500 dark:text-gray-400">No sales yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
