import { useEffect, useState } from 'react';
import api from '../api/client';
import ProductRow from '../components/ProductRow';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import LoadingBlock from '../components/LoadingBlock';

export default function Wishlist() {
  const [fetched, setFetched] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isWishlisted } = useWishlist();

  useEffect(() => {
    api
      .get('/wishlist')
      .then((res) => setFetched(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Filter against the live context state so un-hearting a product here
  // (or anywhere else) removes it from the list immediately.
  const products = fetched.filter((p) => isWishlisted(p.id));

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your wishlist is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Tap the heart on any product to save it here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">My Wishlist</h2>
      <div className="md:hidden max-w-2xl divide-y divide-gray-100 dark:divide-neutral-800">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
