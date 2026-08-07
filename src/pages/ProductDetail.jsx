import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import LoadingBlock from '../components/LoadingBlock';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    setProduct(null);
    api.get(`/products/${slug}`).then((res) => setProduct(res.data));
  }, [slug, user]);

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  const hasSalePrice = product.sale_price !== undefined;
  const hasDiscount = hasSalePrice && Number(product.discount_percent) > 0;
  const finalPrice = product.discount_price ?? product.sale_price ?? product.purchase_price;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Link to="/" className="hover:underline">Home</Link> /{' '}
        {product.category_slug && (
          <>
            <Link to={`/products?category=${product.category_slug}`} className="hover:underline">
              {product.category_name}
            </Link>{' '}
            /{' '}
          </>
        )}
        <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <img src={product.image} alt={product.name} className="w-full rounded-lg shadow object-cover max-h-[420px]" />

        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
            {product.name}
            {product.product_code && <span className="text-gray-400 font-normal text-lg"> ({product.product_code})</span>}
          </h1>
          {product.category_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Category: {product.category_name}</p>
          )}

          <div className="flex items-center flex-wrap gap-3 mb-4">
            {hasDiscount ? (
              <>
                <span className="text-2xl font-bold text-wa-green-dark dark:text-wa-green">{formatPrice(product.discount_price)}</span>
                <span className="text-gray-400 line-through">{formatPrice(product.sale_price)}</span>
                <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded">
                  -{Number(product.discount_percent)}% OFF
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-wa-green-dark dark:text-wa-green">{formatPrice(finalPrice)}</span>
            )}
          </div>

          {hasSalePrice && product.purchase_price !== undefined && (
            <p className="text-sm text-blue-500 dark:text-blue-400 mb-2">
              Cost / Purchase Price: {formatPrice(product.purchase_price)}
            </p>
          )}

          <p className="text-gray-700 dark:text-gray-300 mb-4">{product.description}</p>

          <p className={`mb-4 text-sm font-semibold ${product.stock > 0 ? 'text-wa-green-dark dark:text-wa-green' : 'text-red-600'}`}>
            {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
          </p>

          {product.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
                className="w-20 border border-gray-300 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 rounded px-2 py-1"
              />
            </div>
          )}

          <button
            onClick={() => {
              addToCart(product, quantity);
              setAdded(true);
              setTimeout(() => setAdded(false), 1500);
            }}
            disabled={product.stock <= 0}
            className="bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white font-semibold px-6 py-2.5 rounded-md"
          >
            {added ? 'Added to cart!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
