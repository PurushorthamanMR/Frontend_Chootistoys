import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { fadeUpItem } from '../lib/motion';
import { resolveMediaUrl } from '../lib/mediaUrl';

export default function ProductRow({ product }) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const outOfStock = product.stock <= 0;
  const hasSalePrice = product.sale_price !== undefined;
  const hasDiscount = hasSalePrice && Number(product.discount_percent) > 0;
  const price = hasDiscount ? product.discount_price : (product.sale_price ?? product.purchase_price);
  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const wishlisted = isWishlisted(product.id);
  const atMaxStock = quantity >= product.stock;

  function handleIncrement(e) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || atMaxStock) return;
    addToCart(product, 1);
  }

  function handleDecrement(e) {
    e.preventDefault();
    e.stopPropagation();
    if (quantity <= 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, quantity - 1);
    }
  }

  function handleWishlist(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  return (
    <motion.div variants={fadeUpItem} initial="hidden" animate="show">
      <Link
        to={`/products/${product.slug}`}
        className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-neutral-800 last:border-b-0"
      >
        <img
          src={resolveMediaUrl(product.image)}
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-neutral-800"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {product.name}
            {product.product_code && <span className="text-gray-400 font-normal"> ({product.product_code})</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(price)}</p>
            {hasDiscount && (
              <>
                <p className="text-xs text-gray-400 line-through">{formatPrice(product.sale_price)}</p>
                <span className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                  -{Number(product.discount_percent)}%
                </span>
              </>
            )}
          </div>
          {hasSalePrice && product.purchase_price !== undefined && (
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Cost: {formatPrice(product.purchase_price)}</p>
          )}
        </div>

        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="w-8 h-8 shrink-0 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faHeart} className={wishlisted ? 'text-red-500' : 'text-gray-300 dark:text-neutral-700'} />
        </button>

        {quantity > 0 ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button
              onClick={handleDecrement}
              whileTap={{ scale: 0.85 }}
              aria-label="Decrease quantity"
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
            >
              −
            </motion.button>
            <motion.span
              key={quantity}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="w-5 text-center text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              {quantity}
            </motion.span>
            <motion.button
              onClick={handleIncrement}
              whileTap={{ scale: 0.85 }}
              disabled={outOfStock || atMaxStock}
              aria-label="Increase quantity"
              title={atMaxStock ? `Only ${product.stock} in stock` : undefined}
              className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
            >
              +
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleIncrement}
            whileTap={{ scale: 0.85 }}
            disabled={outOfStock}
            aria-label="Add to cart"
            className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-30 flex items-center justify-center shrink-0 text-gray-900 dark:text-gray-100 text-xl font-light leading-none"
          >
            +
          </motion.button>
        )}
      </Link>
    </motion.div>
  );
}
