import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import NotConfigured from '../components/NotConfigured';
import LoadingBlock from '../components/LoadingBlock';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/categories'), api.get('/subcategories')])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data);
        setSubcategories(subRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-gray-100">All Categories</h2>
      {categories.length === 0 ? (
        <NotConfigured />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const subs = subcategories.filter((sc) => sc.category_id === cat.id);
          return (
            <div
              key={cat.id}
              className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden"
            >
              <Link to={`/products?category=${cat.slug}`} className="group flex items-center gap-3 p-3">
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{cat.name}</span>
              </Link>
              {subs.length > 0 && (
                <div className="flex flex-wrap gap-2 px-3 pb-3">
                  {subs.map((sc) => (
                    <Link
                      key={sc.id}
                      to={`/products?category=${cat.slug}&subcategory=${sc.slug}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-wa-green hover:text-white transition-colors"
                    >
                      {sc.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
