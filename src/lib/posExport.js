import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

function filenameStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function pdfHeader(doc, settings, title) {
  doc.setFontSize(14);
  doc.text(settings?.store_name || 'Store', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (settings?.address) doc.text(settings.address, 14, 21);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(title, 14, 30);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 35);
  doc.setTextColor(0);
}

export function exportSalesPdf(sales, settings) {
  const doc = new jsPDF();
  pdfHeader(doc, settings, 'POS Sales History');
  autoTable(doc, {
    startY: 40,
    head: [['#', 'Date', 'Cashier', 'Customer', 'Total', 'Status']],
    body: sales.map((s) => [
      s.id,
      new Date(s.created_at).toLocaleString(),
      s.staff_name,
      s.customer_name || 'Walk-in',
      Number(s.total_amount).toFixed(2),
      s.status,
    ]),
  });
  doc.save(`sales-history_${filenameStamp()}.pdf`);
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

export function exportZReportPdf({ report, staffSales, settings }) {
  const doc = new jsPDF();
  pdfHeader(doc, settings, `Z-Report - ${report.date}`);

  autoTable(doc, {
    startY: 40,
    head: [['Total Sales', 'Transactions', 'Discounts', 'Voided', 'Returned', 'Outstanding Advances']],
    body: [[
      Number(report.totalSales).toFixed(2),
      report.transactionCount,
      Number(report.totalDiscount).toFixed(2),
      report.voidedCount,
      report.returnedCount ?? 0,
      Number(report.totalBalanceDue ?? 0).toFixed(2),
    ]],
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Payment Method', 'Total']],
    body: (report.paymentBreakdown || []).map((row) => [row.method, Number(row.total).toFixed(2)]),
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Staff', 'Opened', 'Opening Cash', 'Status', 'Closing Cash', 'Expected']],
    body: report.shifts.map((s) => [
      s.staff_name,
      new Date(s.opened_at).toLocaleTimeString(),
      Number(s.opening_cash).toFixed(2),
      s.status,
      s.closing_cash !== null ? Number(s.closing_cash).toFixed(2) : '-',
      s.expected_cash !== null ? Number(s.expected_cash).toFixed(2) : '-',
    ]),
  });

  if (staffSales) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Staff', 'Transactions', 'Total Sales', 'Discounts Given']],
      body: staffSales.map((row) => [
        row.staff_name,
        row.transactionCount,
        Number(row.totalSales).toFixed(2),
        Number(row.totalDiscount).toFixed(2),
      ]),
    });
  }

  doc.save(`z-report_${report.date}.pdf`);
}

export function exportZReportExcel({ report, staffSales }) {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    { Metric: 'Total Sales', Value: Number(report.totalSales) },
    { Metric: 'Transactions', Value: report.transactionCount },
    { Metric: 'Discounts Given', Value: Number(report.totalDiscount) },
    { Metric: 'Voided Sales', Value: report.voidedCount },
    { Metric: 'Returned Sales', Value: report.returnedCount ?? 0 },
    { Metric: 'Outstanding Advances', Value: Number(report.totalBalanceDue ?? 0) },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

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
    Expected: s.expected_cash !== null ? Number(s.expected_cash) : null,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shiftRows), 'Shifts');

  if (staffSales) {
    const staffRows = staffSales.map((row) => ({
      Staff: row.staff_name,
      Transactions: row.transactionCount,
      'Total Sales': Number(row.totalSales),
      'Discounts Given': Number(row.totalDiscount),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffRows), 'Staff Sales');
  }

  XLSX.writeFile(wb, `z-report_${report.date}_${filenameStamp()}.xlsx`);
}

export function exportXReportPdf({ xReport, settings }) {
  const doc = new jsPDF();
  pdfHeader(doc, settings, 'X-Report (Live Shift Snapshot)');

  let y = 40;
  for (const row of xReport.shifts || []) {
    autoTable(doc, {
      startY: y,
      head: [[row.shift.staff_name, 'Opened ' + new Date(row.shift.opened_at).toLocaleTimeString()]],
      body: [
        ['Total Sales', Number(row.totalSales).toFixed(2)],
        ['Transactions', row.transactionCount],
        ['Discounts Given', Number(row.totalDiscount).toFixed(2)],
        ['Outstanding Advances', Number(row.totalBalanceDue).toFixed(2)],
        ['Expected Cash', Number(row.expectedCash).toFixed(2)],
      ],
    });
    y = doc.lastAutoTable.finalY + 4;

    autoTable(doc, {
      startY: y,
      head: [['Payment Method', 'Total']],
      body: (row.paymentBreakdown || []).map((p) => [p.method, Number(p.total).toFixed(2)]),
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  doc.save(`x-report_${filenameStamp()}.pdf`);
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
