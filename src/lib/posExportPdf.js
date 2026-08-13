import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function filenameStamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function pdfHeader(doc, settings, title) {
  doc.setFontSize(14);
  doc.text(settings?.store_name || 'Store', 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  let y = 21;
  if (settings?.address) {
    doc.text(settings.address, 14, y);
    y += 6;
  }
  if (settings?.pos_receipt_phone) {
    doc.text(`Contact: ${settings.pos_receipt_phone}`, 14, y);
    y += 6;
  }
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(title, 14, y + 3);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, y + 8);
  doc.setTextColor(0);
  return y + 8;
}

export function exportSalesPdf(sales, settings) {
  const doc = new jsPDF();
  const headerEndY = pdfHeader(doc, settings, 'POS Sales History');
  autoTable(doc, {
    startY: headerEndY + 5,
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

export function exportZReportPdf({ report, staffSales, settings }) {
  const doc = new jsPDF();
  const isRange = report.from && report.to && report.from !== report.to;
  const headerEndY = pdfHeader(doc, settings, `Z-Report - ${isRange ? `${report.from} to ${report.to}` : report.date}`);

  autoTable(doc, {
    startY: headerEndY + 5,
    head: [['Total Sales', 'Transactions', 'Discounts', 'Voided', 'Returned', 'Outstanding Advances', 'Cash Out']],
    body: [[
      Number(report.totalSales).toFixed(2),
      report.transactionCount,
      Number(report.totalDiscount).toFixed(2),
      report.voidedCount,
      report.returnedCount ?? 0,
      Number(report.totalBalanceDue ?? 0).toFixed(2),
      Number(report.totalCashOut ?? 0).toFixed(2),
    ]],
  });

  if (isRange && report.days?.length) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Date', 'Transactions', 'Total Sales', 'Discounts', 'Voided', 'Returned', 'Cash Out']],
      body: report.days.map((d) => [
        d.date,
        d.transactionCount,
        Number(d.totalSales).toFixed(2),
        Number(d.totalDiscount).toFixed(2),
        d.voidedCount,
        d.returnedCount,
        Number(d.totalCashOut ?? 0).toFixed(2),
      ]),
    });
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Payment Method', 'Total']],
    body: (report.paymentBreakdown || []).map((row) => [row.method, Number(row.total).toFixed(2)]),
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Staff', 'Opened', 'Opening Cash', 'Status', 'Closing Cash', 'Cash Out', 'Expected']],
    body: report.shifts.map((s) => [
      s.staff_name,
      new Date(s.opened_at).toLocaleTimeString(),
      Number(s.opening_cash).toFixed(2),
      s.status,
      s.closing_cash !== null ? Number(s.closing_cash).toFixed(2) : '-',
      Number(s.cash_out_total ?? 0).toFixed(2),
      s.expected_cash !== null ? Number(s.expected_cash).toFixed(2) : '-',
    ]),
  });

  if (staffSales) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: isRange
        ? [['Date', 'Staff', 'Transactions', 'Total Sales', 'Discounts Given']]
        : [['Staff', 'Transactions', 'Total Sales', 'Discounts Given']],
      body: staffSales.map((row) =>
        isRange
          ? [row.date, row.staff_name, row.transactionCount, Number(row.totalSales).toFixed(2), Number(row.totalDiscount).toFixed(2)]
          : [row.staff_name, row.transactionCount, Number(row.totalSales).toFixed(2), Number(row.totalDiscount).toFixed(2)]
      ),
    });
  }

  doc.save(`z-report_${isRange ? `${report.from}_to_${report.to}` : report.date}.pdf`);
}

export function exportXReportPdf({ xReport, settings }) {
  const doc = new jsPDF();
  const headerEndY = pdfHeader(doc, settings, 'X-Report (Live Shift Snapshot)');

  let y = headerEndY + 5;
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
