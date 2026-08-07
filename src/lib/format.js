export function formatRs(value) {
  return `Rs. ${Number(value).toLocaleString('en-LK', { maximumFractionDigits: 0 })}/=`;
}
