export default function RestockForm({ product, stockValue, setStockValue }) {
  return (
    <>
      <p className="font-medium text-gray-900 dark:text-gray-100">{product?.name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Current stock: <span className="font-semibold text-gray-900 dark:text-gray-100">{product?.stock}</span>
      </p>
      <div>
        <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Add Stock</label>
        <input
          required
          type="number"
          min="0"
          value={stockValue}
          onChange={(e) => setStockValue(e.target.value)}
          className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded px-3 py-2"
        />
      </div>
    </>
  );
}
