import { useEffect, useState } from 'react';
import api from '../../api/client';
import LoadingBlock from '../../components/LoadingBlock';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}

export default function PosDailySummary() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const canSeeStaffBreakdown = ['Admin', 'SuperAdmin'].includes(user?.role);
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffSales, setStaffSales] = useState([]);
  const [loadingStaffSales, setLoadingStaffSales] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/pos/reports/daily', { params: { date } })
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    if (!canSeeStaffBreakdown) return;
    setLoadingStaffSales(true);
    api
      .get('/pos/reports/staff-sales', { params: { from: date, to: date } })
      .then((res) => setStaffSales(res.data))
      .finally(() => setLoadingStaffSales(false));
  }, [date, canSeeStaffBreakdown]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Daily Summary (Z-Report)</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {loading || !report ? (
        <LoadingBlock className="py-10" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Total Sales" value={formatPrice(report.totalSales)} />
            <StatCard label="Transactions" value={report.transactionCount} />
            <StatCard label="Discounts Given" value={formatPrice(report.totalDiscount)} />
            <StatCard label="Voided Sales" value={report.voidedCount} />
          </div>

          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Shifts</h3>
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-3">Staff</th>
                  <th className="p-3">Opened</th>
                  <th className="p-3">Opening Cash</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Closing Cash</th>
                  <th className="p-3">Expected</th>
                </tr>
              </thead>
              <tbody>
                {report.shifts.map((s) => (
                  <tr key={s.id} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                    <td className="p-3">{s.staff_name}</td>
                    <td className="p-3 text-gray-500 dark:text-gray-400">{new Date(s.opened_at).toLocaleTimeString()}</td>
                    <td className="p-3">{formatPrice(s.opening_cash)}</td>
                    <td className="p-3 capitalize">{s.status}</td>
                    <td className="p-3">{s.closing_cash !== null ? formatPrice(s.closing_cash) : '-'}</td>
                    <td className="p-3">{s.expected_cash !== null ? formatPrice(s.expected_cash) : '-'}</td>
                  </tr>
                ))}
                {report.shifts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-gray-500 dark:text-gray-400">
                      No shifts on this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {canSeeStaffBreakdown && (
            <>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 mt-6">Sales by Staff</h3>
              {loadingStaffSales ? (
                <LoadingBlock className="py-6" />
              ) : (
                <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="p-3">Staff</th>
                        <th className="p-3">Transactions</th>
                        <th className="p-3">Total Sales</th>
                        <th className="p-3">Discounts Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSales.map((row) => (
                        <tr
                          key={row.staff_id}
                          className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200"
                        >
                          <td className="p-3 font-medium">{row.staff_name}</td>
                          <td className="p-3">{row.transactionCount}</td>
                          <td className="p-3 font-semibold">{formatPrice(row.totalSales)}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">{formatPrice(row.totalDiscount)}</td>
                        </tr>
                      ))}
                      {staffSales.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-gray-500 dark:text-gray-400">
                            No sales on this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
