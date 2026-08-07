import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCurrency } from '../context/CurrencyContext';
import { fadeUpItem } from '../lib/motion';
import { resolveMediaUrl } from '../lib/mediaUrl';

export default function ProductCard({ product }) {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const hasSalePrice = product.sale_price !== undefined;
  const hasDiscount = hasSalePrice && Number(product.discount_percent) > 0;
  const finalPrice = product.discount_price ?? product.sale_price ?? product.purchase_price;
  const outOfStock = product.stock <= 0;
  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const wishlisted = isWishlisted(product.id);
  const atMaxStock = quantity >= product.stock;

  function handleIncrement() {
    if (outOfStock || atMaxStock) return;
    addToCart(product, 1);
  }

  function handleDecrement() {
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
    <motion.div
      variants={fadeUpItem}
      initial="hidden"
      animate="show"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-lg shadow hover:shadow-lg dark:shadow-none flex flex-col overflow-hidden"
    >
      <div className="relative">
        <Link to={`/products/${product.slug}`}>
          <motion.img
            src={resolveMediaUrl(product.image)}
            alt={product.name}
            className="w-full h-40 object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </Link>
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/55 flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
        >
          <FontAwesomeIcon icon={faHeart} className={wishlisted ? 'text-red-500' : 'text-white'} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/products/${product.slug}`} className="font-medium text-sm text-gray-800 dark:text-gray-100 line-clamp-2 flex-1 hover:text-wa-green">
          {product.name}
          {product.product_code && <span className="text-gray-400 font-normal"> ({product.product_code})</span>}
        </Link>
        <div className="mt-2 flex items-center flex-wrap gap-2">
          {hasDiscount ? (
            <>
              <span className="text-wa-green-dark dark:text-wa-green font-bold">{formatPrice(product.discount_price)}</span>
              <span className="text-gray-400 text-xs line-through">{formatPrice(product.sale_price)}</span>
              <span className="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded">
                -{Number(product.discount_percent)}%
              </span>
            </>
          ) : (
            <span className="text-wa-green-dark dark:text-wa-green font-bold">{formatPrice(finalPrice)}</span>
          )}
        </div>
        {hasSalePrice && product.purchase_price !== undefined && (
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Cost: {formatPrice(product.purchase_price)}</p>
        )}

        {quantity > 0 ? (
          <div className="mt-3 flex items-center justify-between bg-gray-100 dark:bg-neutral-800 rounded-md py-1">
            <motion.button
              onClick={handleDecrement}
              whileTap={{ scale: 0.85 }}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100"
            >
              −
            </motion.button>
            <motion.span
              key={quantity}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-gray-900 dark:text-gray-100"
            >
              {quantity}
            </motion.span>
            <motion.button
              onClick={handleIncrement}
              whileTap={{ scale: 0.85 }}
              disabled={outOfStock || atMaxStock}
              aria-label="Increase quantity"
              title={atMaxStock ? `Only ${product.stock} in stock` : undefined}
              className="w-8 h-8 flex items-center justify-center text-lg font-light leading-none text-gray-900 dark:text-gray-100 disabled:opacity-30"
            >
              +
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={handleIncrement}
            disabled={outOfStock}
            whileTap={{ scale: 0.95 }}
            className="mt-3 bg-wa-green hover:bg-wa-green-dark disabled:bg-gray-300 dark:disabled:bg-neutral-700 text-white text-sm font-semibold py-1.5 rounded-md"
          >
            {outOfStock ? 'Out of stock' : 'Add to cart'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
