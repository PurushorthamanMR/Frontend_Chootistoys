import * as XLSX from 'xlsx';

function filenameStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

export function exportSalesExcel(sales) {
  const rows = sales.map((s) => ({
    '#': s.id,
    Date: new Date(s.created_at).toLocaleString(),
    Cashier: s.staff_name,
    Customer: s.customer_name || 'Walk-in',
    Total: Number(s.total_amount),
    Status: s.status,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales History');
  XLSX.writeFile(wb, `sales-history_${filenameStamp()}.xlsx`);
}

export function exportZReportExcel({ report, staffSales }) {
  const wb = XLSX.utils.book_new();
  const isRange = report.from && report.to && report.from !== report.to;

  const summaryRows = [
    { Metric: 'Total Sales', Value: Number(report.totalSales) },
    { Metric: 'Transactions', Value: report.transactionCount },
    { Metric: 'Discounts Given', Value: Number(report.totalDiscount) },
    { Metric: 'Voided Sales', Value: report.voidedCount },
    { Metric: 'Returned Sales', Value: report.returnedCount ?? 0 },
    { Metric: 'Outstanding Advances', Value: Number(report.totalBalanceDue ?? 0) },
    { Metric: 'Cash Out', Value: Number(report.totalCashOut ?? 0) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

  if (isRange && report.days?.length) {
    const dayRows = report.days.map((d) => ({
      Date: d.date,
      Transactions: d.transactionCount,
      'Total Sales': Number(d.totalSales),
      Discounts: Number(d.totalDiscount),
      Voided: d.voidedCount,
      Returned: d.returnedCount,
      'Cash Out': Number(d.totalCashOut ?? 0),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayRows), 'By Date');
  }

  const paymentRows = (report.paymentBreakdown || []).map((row) => ({
    Method: row.method,
    Total: Number(row.total),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payment Breakdown');

  const shiftRows = report.shifts.map((s) => ({
    Staff: s.staff_name,
    Opened: new Date(s.opened_at).toLocaleTimeString(),
    'Opening Cash': Number(s.opening_cash),
    Status: s.status,
    'Closing Cash': s.closing_cash !== null ? Number(s.closing_cash) : null,
    'Cash Out': Number(s.cash_out_total ?? 0),
    Expected: s.expected_cash !== null ? Number(s.expected_cash) : null,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shiftRows), 'Shifts');

  if (staffSales) {
    const staffRows = staffSales.map((row) => ({
      ...(isRange ? { Date: row.date } : {}),
      Staff: row.staff_name,
      Transactions: row.transactionCount,
      'Total Sales': Number(row.totalSales),
      'Discounts Given': Number(row.totalDiscount),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffRows), 'Staff Sales');
  }

  XLSX.writeFile(wb, `z-report_${isRange ? `${report.from}_to_${report.to}` : report.date}_${filenameStamp()}.xlsx`);
}

export function exportXReportExcel({ xReport }) {
  const wb = XLSX.utils.book_new();

  const summaryRows = (xReport.shifts || []).map((row) => ({
    Staff: row.shift.staff_name,
    Opened: new Date(row.shift.opened_at).toLocaleTimeString(),
    'Total Sales': Number(row.totalSales),
    Transactions: row.transactionCount,
    'Discounts Given': Number(row.totalDiscount),
    'Outstanding Advances': Number(row.totalBalanceDue),
    'Expected Cash': Number(row.expectedCash),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Shifts');

  const paymentRows = (xReport.shifts || []).flatMap((row) =>
    (row.paymentBreakdown || []).map((p) => ({
      Staff: row.shift.staff_name,
      Method: p.method,
      Total: Number(p.total),
    }))
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payment Breakdown');

  XLSX.writeFile(wb, `x-report_${filenameStamp()}.xlsx`);
}
