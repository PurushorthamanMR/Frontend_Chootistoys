import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faFilePdf, faFileExcel, faRotate } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/client';
import LoadingBlock from '../../components/LoadingBlock';
import { useSettings } from '../../context/SettingsContext';
import { useCurrency } from '../../context/CurrencyContext';
import { buildXReportHtml } from '../../lib/receiptTemplate';
import { printHtml } from '../../lib/printHtml';
import { exportXReportPdf, exportXReportExcel } from '../../lib/posExport';

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );
}

export default function PosXReport() {
  const { settings } = useSettings();
  const { formatPrice } = useCurrency();
  const [xReport, setXReport] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api
      .get('/pos/reports/x-report')
      .then((res) => setXReport(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">X-Report</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Live snapshot of the current open shift(s) - not a shift close.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300"
          >
            <FontAwesomeIcon icon={faRotate} />
            Refresh
          </button>
          <button
            type="button"
            disabled={!xReport}
            onClick={() => printHtml(buildXReportHtml({ xReport, settings, formatPrice }), 'X-Report')}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-wa-green hover:bg-wa-green-dark disabled:opacity-40 text-white"
          >
            <FontAwesomeIcon icon={faPrint} />
            Print X-Report
          </button>
          <button
            type="button"
            disabled={!xReport}
            onClick={() => exportXReportPdf({ xReport, settings })}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            Export PDF
          </button>
          <button
            type="button"
            disabled={!xReport}
            onClick={() => exportXReportExcel({ xReport })}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 disabled:opacity-40"
          >
            <FontAwesomeIcon icon={faFileExcel} />
            Export Excel
          </button>
        </div>
      </div>

      {loading || !xReport ? (
        <LoadingBlock className="py-10" />
      ) : xReport.shifts.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No open shifts right now.</p>
      ) : (
        <div className="space-y-6">
          {xReport.shifts.map((row) => (
            <div key={row.shift.id} className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{row.shift.staff_name}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Opened {new Date(row.shift.opened_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                <StatCard label="Total Sales" value={formatPrice(row.totalSales)} />
                <StatCard label="Transactions" value={row.transactionCount} />
                <StatCard label="Discounts Given" value={formatPrice(row.totalDiscount)} />
                <StatCard label="Outstanding Advances" value={formatPrice(row.totalBalanceDue)} />
                <StatCard label="Expected Cash" value={formatPrice(row.expectedCash)} />
                <StatCard label="Opening Cash" value={formatPrice(row.shift.opening_cash)} />
              </div>

              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Payment Method Breakdown</h4>
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="p-2">Method</th>
                      <th className="p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.paymentBreakdown.map((p) => (
                      <tr key={p.method} className="border-t border-gray-200 dark:border-neutral-700">
                        <td className="p-2 capitalize">{p.method}</td>
                        <td className="p-2 font-semibold">{formatPrice(p.total)}</td>
                      </tr>
                    ))}
                    {row.paymentBreakdown.length === 0 && (
                      <tr>
                        <td colSpan={2} className="p-2 text-gray-500 dark:text-gray-400">
                          No payments yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
