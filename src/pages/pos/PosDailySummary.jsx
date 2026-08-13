import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faFilePdf, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import LoadingBlock from '../../components/LoadingBlock';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../context/CurrencyContext';
import { usePosReduceSale } from '../../context/PosReduceSaleContext';
import { buildZReportHtml } from '../../lib/receiptTemplate';
import { printHtml } from '../../lib/printHtml';
import { exportZReportPdf, exportZReportExcel } from '../../lib/posExport';

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
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const { reducedSaleActive } = usePosReduceSale();
  const canSeeStaffBreakdown = ['Admin', 'SuperAdmin'].includes(user?.role);
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffSales, setStaffSales] = useState([]);
  const [loadingStaffSales, setLoadingStaffSales] = useState(true);
  const isRange = from !== to;

  useEffect(() => {
    setLoading(true);
    const params = { from, to };
    if (reducedSaleActive) params.reduced = 1;
    api
      .get('/pos/reports/daily', { params })
      .then((res) => setReport(res.data))
      .finally(() => setLoading(false));
  }, [from, to, reducedSaleActive]);

  useEffect(() => {
    if (!canSeeStaffBreakdown) return;
    setLoadingStaffSales(true);
    const params = { from, to };
    if (reducedSaleActive) params.reduced = 1;
    api
      .get('/pos/reports/staff-sales', { params })
      .then((res) => setStaffSales(res.data))
      .finally(() => setLoadingStaffSales(false));
  }, [from, to, canSeeStaffBreakdown, reducedSaleActive]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Z-Report</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
            <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={todayISO()}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={!report}
            onClick={() =>
              printHtml(
                buildZReportHtml({
                  report,
                  staffSales: canSeeStaffBreakdown ? staffSales : undefined,
                  settings,
                  formatPrice,
                }),
                isRange ? `Z-Report ${from} to ${to}` : `Z-Report ${to}`
              )
            }
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white"
          >
            <FontAwesomeIcon icon={faPrint} />
            Print Z-Report
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={() => exportZReportPdf({ report, staffSales: canSeeStaffBreakdown ? staffSales : undefined, settings })}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            Export PDF
          </button>
          <button
            type="button"
            disabled={!report}
            onClick={() => exportZReportExcel({ report, staffSales: canSeeStaffBreakdown ? staffSales : undefined })}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFileExcel} />
            Export Excel
          </button>
        </div>
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
            <StatCard label="Returned Sales" value={report.returnedCount ?? 0} />
            <StatCard label="Outstanding Advances" value={formatPrice(report.totalBalanceDue ?? 0)} />
            <StatCard label="Cash Out" value={formatPrice(report.totalCashOut ?? 0)} />
          </div>

          {isRange && report.days && report.days.length > 0 && (
            <>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">By Date</h3>
              <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Transactions</th>
                      <th className="p-3">Total Sales</th>
                      <th className="p-3">Discounts</th>
                      <th className="p-3">Voided</th>
                      <th className="p-3">Returned</th>
                      <th className="p-3">Cash Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.days.map((d) => (
                      <tr key={d.date} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                        <td className="p-3 font-medium">{d.date}</td>
                        <td className="p-3">{d.transactionCount}</td>
                        <td className="p-3 font-semibold">{formatPrice(d.totalSales)}</td>
                        <td className="p-3 text-gray-500 dark:text-gray-400">{formatPrice(d.totalDiscount)}</td>
                        <td className="p-3">{d.voidedCount}</td>
                        <td className="p-3">{d.returnedCount}</td>
                        <td className="p-3">{formatPrice(d.totalCashOut ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Payment Method Breakdown</h3>
          <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow dark:shadow-none overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-800 text-left text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="p-3">Method</th>
                  <th className="p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(report.paymentBreakdown || []).map((row) => (
                  <tr key={row.method} className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200">
                    <td className="p-3 capitalize">{row.method}</td>
                    <td className="p-3 font-semibold">{formatPrice(row.total)}</td>
                  </tr>
                ))}
                {(!report.paymentBreakdown || report.paymentBreakdown.length === 0) && (
                  <tr>
                    <td colSpan={2} className="p-4 text-gray-500 dark:text-gray-400">
                      No payments in this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                  <th className="p-3">Cash Out</th>
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
                    <td className="p-3">{formatPrice(s.cash_out_total ?? 0)}</td>
                    <td className="p-3">{s.expected_cash !== null ? formatPrice(s.expected_cash) : '-'}</td>
                  </tr>
                ))}
                {report.shifts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-gray-500 dark:text-gray-400">
                      No shifts in this range.
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
                        {isRange && <th className="p-3">Date</th>}
                        <th className="p-3">Staff</th>
                        <th className="p-3">Transactions</th>
                        <th className="p-3">Total Sales</th>
                        <th className="p-3">Discounts Given</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffSales.map((row) => (
                        <tr
                          key={`${row.date}-${row.staff_id}`}
                          className="border-t border-gray-200 dark:border-neutral-800 text-gray-800 dark:text-gray-200"
                        >
                          {isRange && <td className="p-3 text-gray-500 dark:text-gray-400">{row.date}</td>}
                          <td className="p-3 font-medium">{row.staff_name}</td>
                          <td className="p-3">{row.transactionCount}</td>
                          <td className="p-3 font-semibold">{formatPrice(row.totalSales)}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-400">{formatPrice(row.totalDiscount)}</td>
                        </tr>
                      ))}
                      {staffSales.length === 0 && (
                        <tr>
                          <td colSpan={isRange ? 5 : 4} className="p-4 text-gray-500 dark:text-gray-400">
                            No sales in this range.
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
