import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      return;
    }
    api
      .get('/wishlist/ids')
      .then((res) => setIds(new Set(res.data)))
      .catch(() => {});
  }, [user]);

  function isWishlisted(productId) {
    return ids.has(productId);
  }

  async function toggleWishlist(product) {
    if (!user) {
      navigate('/login');
      return;
    }
    const wasWishlisted = ids.has(product.id);
    setIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
    try {
      await api.post(`/wishlist/${product.id}/toggle`);
    } catch {
      setIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) {
          next.add(product.id);
        } else {
          next.delete(product.id);
        }
        return next;
      });
    }
  }

  return (
    <WishlistContext.Provider value={{ isWishlisted, toggleWishlist, count: ids.size }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
