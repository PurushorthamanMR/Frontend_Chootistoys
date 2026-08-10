// Builds the printable/previewable HTML for POS documents (sale receipt and
// Z-report). One HTML string per document, reused for both the on-screen
// preview (ReceiptModal, via dangerouslySetInnerHTML) and the physical print
// (printHtml) - a single source of truth for the bill design.

const RECEIPT_STYLES = `
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      width: 78mm;
      margin: 0 auto;
      padding: 4mm;
      font-size: 12px;
      line-height: 1.45;
    }
    @page { size: 80mm auto; margin: 0; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .store-name { font-size: 15px; font-weight: 700; }
    .muted { color: #444; font-size: 11px; }
    .rule { border: none; border-top: 1px dashed #333; margin: 6px 0; }
    .rule-solid { border: none; border-top: 1px solid #333; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    thead th { text-align: left; font-size: 11px; border-bottom: 1px solid #333; padding: 2px 0; }
    thead th.amt, td.amt { text-align: right; }
    thead th.qty, td.qty { text-align: left; width: 26px; }
    tbody td { padding: 2px 0; vertical-align: top; font-size: 12px; }
    .item-sub { font-size: 10.5px; color: #555; }
    .totals-row { display: flex; justify-content: space-between; font-size: 12px; padding: 1px 0; }
    .totals-row.grand { font-weight: 700; font-size: 13.5px; padding-top: 4px; }
    .kv-row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 1px 0; }
    .section-title { font-weight: 700; font-size: 12px; margin: 8px 0 2px; }
    .thank-you { margin-top: 10px; font-size: 12px; }
  </style>
`;

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function headerBlock(settings) {
  const lines = [
    `<div class="center store-name">${escapeHtml(settings?.store_name || 'Store')}</div>`,
  ];
  if (settings?.address) lines.push(`<div class="center muted">${escapeHtml(settings.address)}</div>`);
  if (settings?.pos_receipt_phone) lines.push(`<div class="center muted">Contact: ${escapeHtml(settings.pos_receipt_phone)}</div>`);
  return lines.join('\n');
}

export function buildReceiptHtml({ sale, settings, formatPrice }) {
  const items = sale?.items || [];
  const dateStr = sale?.created_at ? new Date(sale.created_at).toLocaleString() : new Date().toLocaleString();

  const rows = items
    .map((it) => {
      const qty = Number(it.quantity);
      const price = Number(it.price);
      return `
        <tr>
          <td class="qty">${qty}</td>
          <td>
            ${escapeHtml(it.product_name)}${it.product_code ? ` <span class="item-sub">(${escapeHtml(it.product_code)})</span>` : ''}
            <div class="item-sub">@${formatPrice(price)} ea</div>
          </td>
          <td class="amt">${formatPrice(price * qty)}</td>
        </tr>
      `;
    })
    .join('');

  const discount = Number(sale?.discount_amount) || 0;
  const taxPct = Number(sale?.tax_percent) || 0;
  const svcPct = Number(sale?.service_charge_percent) || 0;
  const subtotal = Number(sale?.subtotal) || 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const taxAmount = afterDiscount * (taxPct / 100);
  const svcAmount = afterDiscount * (svcPct / 100);

  return `
    ${RECEIPT_STYLES}
    ${headerBlock(settings)}
    <hr class="rule-solid" />
    <div class="kv-row"><span>Bill No</span><span>#${sale?.id ?? ''}</span></div>
    <div class="kv-row"><span>Date</span><span>${escapeHtml(dateStr)}</span></div>
    ${sale?.staff_name ? `<div class="kv-row"><span>Cashier</span><span>${escapeHtml(sale.staff_name)}</span></div>` : ''}
    ${sale?.customer_name ? `<div class="kv-row"><span>Customer</span><span>${escapeHtml(sale.customer_name)}</span></div>` : ''}
    <hr class="rule" />
    <table>
      <thead>
        <tr><th class="qty">Qty</th><th>Description</th><th class="amt">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <hr class="rule" />
    <div class="totals-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    ${discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-${formatPrice(discount)}</span></div>` : ''}
    ${svcAmount > 0 ? `<div class="totals-row"><span>Service Charge (${svcPct}%)</span><span>${formatPrice(svcAmount)}</span></div>` : ''}
    ${taxAmount > 0 ? `<div class="totals-row"><span>Tax (${taxPct}%)</span><span>${formatPrice(taxAmount)}</span></div>` : ''}
    <div class="totals-row grand"><span>Total</span><span>${formatPrice(Number(sale?.total_amount) || 0)}</span></div>
    <hr class="rule" />
    <div class="kv-row"><span>Paid by</span><span class="bold">${escapeHtml(sale?.payment_method || 'Cash')}</span></div>
    <div class="kv-row"><span>Amount Paid</span><span>${formatPrice(Number(sale?.amount_paid ?? sale?.total_amount) || 0)}</span></div>
    ${
      Number(sale?.balance_due) > 0
        ? `<div class="kv-row bold"><span>Balance Due</span><span>${formatPrice(Number(sale.balance_due))}</span></div>`
        : ''
    }
    <div class="center thank-you">Thank you!</div>
  `;
}

function paymentBreakdownRows(paymentBreakdown, formatPrice) {
  return (paymentBreakdown || [])
    .map((row) => `<div class="kv-row"><span class="bold">${escapeHtml(row.method)}</span><span>${formatPrice(row.total)}</span></div>`)
    .join('');
}

export function buildZReportHtml({ report, staffSales, settings, formatPrice }) {
  const shiftRows = (report?.shifts || [])
    .map(
      (s) => `
        <div class="kv-row bold"><span>${escapeHtml(s.staff_name)}</span><span>${escapeHtml(s.status)}</span></div>
        <div class="kv-row"><span>Opened</span><span>${new Date(s.opened_at).toLocaleTimeString()}</span></div>
        <div class="kv-row"><span>Opening Cash</span><span>${formatPrice(s.opening_cash)}</span></div>
        ${s.closing_cash !== null ? `<div class="kv-row"><span>Closing Cash</span><span>${formatPrice(s.closing_cash)}</span></div>` : ''}
        ${s.expected_cash !== null ? `<div class="kv-row"><span>Expected Cash</span><span>${formatPrice(s.expected_cash)}</span></div>` : ''}
        <hr class="rule" />
      `
    )
    .join('');

  const staffRows = (staffSales || [])
    .map(
      (row) => `
        <div class="kv-row bold"><span>${escapeHtml(row.staff_name)}</span><span>${formatPrice(row.totalSales)}</span></div>
        <div class="kv-row"><span>Transactions</span><span>${row.transactionCount}</span></div>
        <div class="kv-row"><span>Discounts Given</span><span>${formatPrice(row.totalDiscount)}</span></div>
        <hr class="rule" />
      `
    )
    .join('');

  return `
    ${RECEIPT_STYLES}
    ${headerBlock(settings)}
    <hr class="rule-solid" />
    <div class="center bold">Z-REPORT</div>
    <div class="center muted">${escapeHtml(report?.date || '')}</div>
    <hr class="rule" />
    <div class="totals-row"><span>Total Sales</span><span>${formatPrice(report?.totalSales)}</span></div>
    <div class="totals-row"><span>Transactions</span><span>${report?.transactionCount}</span></div>
    <div class="totals-row"><span>Discounts Given</span><span>${formatPrice(report?.totalDiscount)}</span></div>
    <div class="totals-row"><span>Voided Sales</span><span>${report?.voidedCount}</span></div>
    <div class="totals-row"><span>Returned Sales</span><span>${report?.returnedCount ?? 0}</span></div>
    <div class="totals-row"><span>Outstanding Advances</span><span>${formatPrice(report?.totalBalanceDue ?? 0)}</span></div>
    <hr class="rule" />
    <div class="section-title">Payment Method Breakdown</div>
    ${paymentBreakdownRows(report?.paymentBreakdown, formatPrice) || '<div class="muted">No payments on this date.</div>'}
    <hr class="rule" />
    <div class="section-title">Shifts</div>
    ${shiftRows || '<div class="muted">No shifts on this date.</div>'}
    ${
      staffSales
        ? `<div class="section-title">Sales by Staff</div>${staffRows || '<div class="muted">No sales on this date.</div>'}`
        : ''
    }
    <div class="center thank-you">-- End of Report --</div>
  `;
}

export function buildXReportHtml({ xReport, settings, formatPrice }) {
  const shiftBlocks = (xReport?.shifts || [])
    .map(
      (row) => `
        <div class="section-title">${escapeHtml(row.shift.staff_name)}</div>
        <div class="kv-row"><span>Opened</span><span>${new Date(row.shift.opened_at).toLocaleTimeString()}</span></div>
        <div class="kv-row"><span>Opening Cash</span><span>${formatPrice(row.shift.opening_cash)}</span></div>
        <div class="totals-row"><span>Total Sales</span><span>${formatPrice(row.totalSales)}</span></div>
        <div class="totals-row"><span>Transactions</span><span>${row.transactionCount}</span></div>
        <div class="totals-row"><span>Discounts Given</span><span>${formatPrice(row.totalDiscount)}</span></div>
        <div class="totals-row"><span>Outstanding Advances</span><span>${formatPrice(row.totalBalanceDue)}</span></div>
        <div class="totals-row bold"><span>Expected Cash</span><span>${formatPrice(row.expectedCash)}</span></div>
        <div class="kv-row bold"><span>Payment Breakdown</span><span></span></div>
        ${paymentBreakdownRows(row.paymentBreakdown, formatPrice) || '<div class="muted">No payments yet.</div>'}
        <hr class="rule" />
      `
    )
    .join('');

  return `
    ${RECEIPT_STYLES}
    ${headerBlock(settings)}
    <hr class="rule-solid" />
    <div class="center bold">X-REPORT</div>
    <div class="center muted">${xReport?.generatedAt ? new Date(xReport.generatedAt).toLocaleString() : ''}</div>
    <div class="center muted">Live snapshot - shift not yet closed</div>
    <hr class="rule" />
    ${shiftBlocks || '<div class="muted">No open shifts.</div>'}
    <div class="center thank-you">-- End of Report --</div>
  `;
}
