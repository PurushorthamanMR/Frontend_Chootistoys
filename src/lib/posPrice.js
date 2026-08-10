/** Resolve the unit price POS should show/charge from SuperAdmin `pos_display_price`. */
export function posUnitPrice(product, mode = 'sale') {
  if (!product) return 0;
  if (mode === 'cost') return Number(product.purchase_price) || 0;
  return Number(product.discount_percent) > 0
    ? Number(product.discount_price)
    : Number(product.sale_price) || 0;
}
