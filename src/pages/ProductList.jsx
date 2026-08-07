import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import ProductRow from '../components/ProductRow';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import NotConfigured from '../components/NotConfigured';
import LoadingBlock from '../components/LoadingBlock';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

export default function ProductList() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const search = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
    api.get('/subcategories').then((res) => setSubcategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (search) params.set('search', search);
    api
      .get(`/products?${params.toString()}`)
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [category, subcategory, search, user]);

  useEffect(() => {
    setPage(1);
  }, [category, subcategory, search]);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectCategory(slug) {
    const params = {};
    if (slug) params.category = slug;
    if (search) params.search = search;
    setSearchParams(params);
  }

  function selectSubcategory(slug) {
    const params = {};
    if (category) params.category = category;
    if (slug) params.subcategory = slug;
    if (search) params.search = search;
    setSearchParams(params);
  }

  const allChip = { slug: '', name: 'All Products' };
  const chips = [allChip, ...categories];
  const activeCategorySubcategories = category
    ? subcategories.filter((sc) => sc.category_slug === category)
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 flex flex-col lg:flex-row gap-6">
      <div className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chips.map((cat) => {
          const active = category === cat.slug;
          return (
            <motion.button
              key={cat.slug || 'all'}
              whileTap={{ scale: 0.95 }}
              onClick={() => selectCategory(cat.slug)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                active
                  ? 'bg-wa-green text-white'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat.name}
            </motion.button>
          );
        })}
      </div>

      {activeCategorySubcategories.length > 0 && (
        <div className="lg:hidden -mx-4 px-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {activeCategorySubcategories.map((sc) => {
            const active = subcategory === sc.slug;
            return (
              <motion.button
                key={sc.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectSubcategory(active ? '' : sc.slug)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border ${
                  active
                    ? 'bg-wa-green-dark/10 border-wa-green text-wa-green-dark dark:text-wa-green'
                    : 'border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {sc.name}
              </motion.button>
            );
          })}
        </div>
      )}

      <aside className="hidden lg:block lg:w-64 shrink-0">
        <div className="sticky top-24 bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-xl shadow-sm dark:shadow-none p-4 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <h3 className="flex items-center gap-2 font-bold mb-3 text-gray-900 dark:text-gray-100">
            <FontAwesomeIcon icon={faLayerGroup} className="text-wa-green-dark dark:text-wa-green" />
            Categories
          </h3>
          <ul className="space-y-1">
            {chips.map((cat) => {
              const active = category === cat.slug;
              return (
                <li key={cat.slug || 'all'}>
                  <button
                    onClick={() => selectCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                      active
                        ? 'bg-wa-green text-white font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat.name}
                  </button>
                  {active && cat.slug && activeCategorySubcategories.length > 0 && (
                    <ul className="mt-1 ml-3 space-y-1 border-l border-gray-200 dark:border-neutral-700 pl-3">
                      {activeCategorySubcategories.map((sc) => (
                        <li key={sc.id}>
                          <button
                            onClick={() => selectSubcategory(sc.slug)}
                            className={`w-full text-left px-2 py-1.5 rounded-md text-xs truncate transition-colors ${
                              subcategory === sc.slug
                                ? 'bg-wa-green/10 text-wa-green-dark dark:text-wa-green font-semibold'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {sc.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <div className="flex-1">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {search
            ? `Search results for "${search}"`
            : subcategory
              ? subcategories.find((sc) => sc.slug === subcategory)?.name || 'Products'
              : category
                ? categories.find((c) => c.slug === category)?.name || 'Products'
                : 'All Products'}
        </h2>
        {loading ? (
          <LoadingBlock className="py-16" />
        ) : products.length === 0 ? (
          <NotConfigured />
        ) : (
          <div key={`${category}-${subcategory}-${search}-${page}`}>
            <div className="md:hidden max-w-2xl divide-y divide-gray-100 dark:divide-neutral-800">
              {pagedProducts.map((p) => (
                <ProductRow key={p.id} product={p} />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pagedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
