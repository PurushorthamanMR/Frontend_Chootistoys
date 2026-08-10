import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFire,
  faStar,
  faLayerGroup,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import api from '../api/client';
import ProductRow from '../components/ProductRow';
import ProductCard from '../components/ProductCard';
import NotConfigured from '../components/NotConfigured';
import LoadingBlock from '../components/LoadingBlock';
import { getHomeCache, setHomeCache } from '../lib/homeCache';
import { useAuth } from '../context/AuthContext';

const PRODUCTS_PAGE_SIZE = 10;

function ProductGrid({ products, columns = 'md:grid-cols-2 lg:grid-cols-4' }) {
  return (
    <div>
      <div className="md:hidden max-w-2xl divide-y divide-gray-100 dark:divide-neutral-800">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
      <div className={`hidden md:grid ${columns} gap-4`}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={icon} className="text-wa-green-dark dark:text-wa-green" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function CategoryTile({ cat, size = 'w-16 h-16 sm:w-20 sm:h-20' }) {
  return (
    <Link to={`/products?category=${cat.slug}`} className="flex flex-col items-center gap-2 text-center">
      <div className={`${size} rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800`}>
        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
      </div>
      <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{cat.name}</span>
    </Link>
  );
}

function BannerCarousel({ banners }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % banners.length), 4500);
    return () => clearInterval(id);
  }, [banners.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index];
    if (card) {
      track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    }
  }, [index]);

  if (banners.length === 0) return null;

  function goTo(i) {
    setIndex((i + banners.length) % banners.length);
  }

  return (
    <div>
      {/* Desktop: wide cinematic banner with overlay + CTA */}
      <div className="hidden lg:block relative rounded-3xl overflow-hidden h-80">
        <AnimatePresence mode="wait">
          <motion.div
            key={banners[index].id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <img src={banners[index].image} alt="Store banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-10 left-10 max-w-md">
          <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">Limited time</p>
          <h3 className="text-white text-3xl font-extrabold mb-5">Discover more offers</h3>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-wa-green hover:bg-wa-green-dark text-white font-bold px-5 py-2.5 rounded-full"
          >
            Shop Now
            <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>

        {banners.length > 1 && (
          <>
            <button
              onClick={() => goTo(index - 1)}
              aria-label="Previous banner"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              onClick={() => goTo(index + 1)}
              aria-label="Next banner"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <div className="absolute bottom-4 right-8 flex gap-1.5">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => goTo(i)}
                  aria-label={`Go to banner ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile: compact swipeable card strip */}
      <div className="lg:hidden">
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {banners.map((b) => (
            <Link
              key={b.id}
              to="/products"
              className="relative shrink-0 w-[85%] snap-center rounded-2xl overflow-hidden h-44 bg-gray-100 dark:bg-neutral-800"
            >
              <img src={b.image} alt="Store banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-white/95 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                Shop Now
              </span>
            </Link>
          ))}
        </div>
        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(i)}
                aria-label={`Go to banner ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === index ? 'bg-wa-green' : 'bg-gray-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Deliberately different from the square "Hot Categories" tiles and the
// pill-shaped "Featured Categories" avatars - bigger gradient-overlay cards
// so this section reads as its own thing while scanning the page.
function SubcategorySpotlight({ subcategories }) {
  if (subcategories.length === 0) return null;
  return (
    <div>
      <SectionHeading icon={faSitemap} title="Explore Subcategories" />
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {subcategories.map((sub) => (
          <Link
            key={sub.id}
            to={`/products?subcategory=${sub.slug}`}
            className="group relative shrink-0 snap-start w-40 sm:w-48 h-52 sm:h-60 rounded-3xl overflow-hidden bg-gray-100 dark:bg-neutral-800"
          >
            <img
              src={sub.image}
              alt={sub.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <span className="absolute bottom-4 left-4 right-4 text-white font-bold text-base leading-snug line-clamp-2">
              {sub.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function OfferBannerSection({ offerImage }) {
  if (!offerImage) return null;
  return (
    <Link to="/products" className="block rounded-2xl overflow-hidden">
      <img src={offerImage} alt="Current offer" className="w-full h-40 sm:h-56 lg:h-72 object-cover" />
    </Link>
  );
}

function HotCategoriesSection({ hotCategories }) {
  if (hotCategories.length === 0) return null;
  return (
    <div>
      <SectionHeading icon={faFire} title="Hot Categories" />
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-4">
        {hotCategories.map((cat) => (
          <CategoryTile key={cat.id} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function FeaturedProductsSection({ featuredProducts }) {
  if (featuredProducts.length === 0) return null;
  return (
    <div>
      <SectionHeading icon={faStar} title="Featured Products" />
      <ProductGrid products={featuredProducts} columns="md:grid-cols-2 lg:grid-cols-3" />
    </div>
  );
}

function FeaturedCategoriesSection({ featuredCategories }) {
  if (featuredCategories.length === 0) return null;
  return (
    <div>
      <SectionHeading icon={faLayerGroup} title="Featured Categories" />
      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {featuredCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/products?category=${cat.slug}`}
            className="shrink-0 w-24 sm:w-28 flex flex-col items-center gap-2 text-center"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <span className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function BestSellingSection({ bestSelling }) {
  if (bestSelling.length === 0) return null;
  return (
    <div>
      <SectionHeading icon={faFire} title="Best Selling" />
      <ProductGrid products={bestSelling} columns="md:grid-cols-2 lg:grid-cols-5" />
    </div>
  );
}

function AllProductsSection({ onEmptyChange }) {
  const { user } = useAuth();
  const cached = getHomeCache();
  const [products, setProducts] = useState(cached?.allProducts ?? []);
  const [offset, setOffset] = useState(cached?.allProductsOffset ?? 0);
  const [hasMore, setHasMore] = useState(cached?.allProductsHasMore ?? true);
  const [loading, setLoading] = useState(!cached?.allProducts);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    // Paint instantly from cache if we have it, but always refetch page one
    // in the background so a returning visit still picks up fresh data
    // (e.g. products added/edited elsewhere) instead of staying stale.
    // Also refetches whenever auth state changes (login/logout), since the
    // price fields the backend returns depend on the caller's role.
    api
      .get(`/products?limit=${PRODUCTS_PAGE_SIZE}&offset=0`)
      .then((res) => {
        setProducts(res.data);
        setHasMore(res.data.length === PRODUCTS_PAGE_SIZE);
        setOffset(res.data.length);
        setHomeCache({
          allProducts: res.data,
          allProductsOffset: res.data.length,
          allProductsHasMore: res.data.length === PRODUCTS_PAGE_SIZE,
        });
        onEmptyChange?.(res.data.length === 0);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!loading && products.length === 0) return null;

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await api.get(`/products?limit=${PRODUCTS_PAGE_SIZE}&offset=${offset}`);
      const next = [...products, ...res.data];
      const nextHasMore = res.data.length === PRODUCTS_PAGE_SIZE;
      const nextOffset = offset + res.data.length;
      setProducts(next);
      setHasMore(nextHasMore);
      setOffset(nextOffset);
      setHomeCache({ allProducts: next, allProductsOffset: nextOffset, allProductsHasMore: nextHasMore });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section>
      <SectionHeading
        icon={faLayerGroup}
        title="All Products"
        action={
          <Link
            to="/products"
            className="flex items-center gap-1.5 text-sm font-semibold text-wa-green-dark dark:text-wa-green hover:underline shrink-0"
          >
            See More
            <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
          </Link>
        }
      />
      {loading ? (
        <LoadingBlock className="py-6" />
      ) : (
        <>
          <ProductGrid products={products} columns="md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5" />
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-neutral-700 disabled:opacity-60"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </>
      )}
    </section>
  );
}

// Default render order, matching the order these sections shipped in before
// the Admin > Home Layout drag-and-drop feature existed - used to paint
// instantly before /api/home-sections responds (and as a fallback if that
// request fails), and must stay in sync with Backend/src/utils/homeSections.js.
const DEFAULT_SECTION_ORDER = [
  'offer_banner',
  'hot_categories',
  'featured_products',
  'featured_categories',
  'subcategory_spotlight',
  'best_selling',
  'banner_carousel',
  'all_products',
].map((section_key, position) => ({ section_key, position, is_visible: true }));

export default function Home() {
  const { user } = useAuth();
  const cached = getHomeCache();
  const [offerImage, setOfferImage] = useState(cached?.offerImage ?? null);
  const [hotCategories, setHotCategories] = useState(cached?.hotCategories ?? []);
  const [hotSubcategories, setHotSubcategories] = useState(cached?.hotSubcategories ?? []);
  const [featuredProducts, setFeaturedProducts] = useState(cached?.featuredProducts ?? []);
  const [featuredCategories, setFeaturedCategories] = useState(cached?.featuredCategories ?? []);
  const [bestSelling, setBestSelling] = useState(cached?.bestSelling ?? []);
  const [banners, setBanners] = useState(cached?.banners ?? []);
  const [sectionOrder, setSectionOrder] = useState(cached?.sectionOrder ?? DEFAULT_SECTION_ORDER);
  const [loading, setLoading] = useState(!cached);
  const [productsEmpty, setProductsEmpty] = useState(
    cached?.allProducts ? cached.allProducts.length === 0 : false
  );

  useEffect(() => {
    // Refetch in the background even when cache exists, so a returning
    // visit shows instantly but still picks up fresh data quietly.
    // Depends on `user` so a login/logout also triggers a refetch - the
    // backend returns different price fields depending on the caller's role.
    Promise.all([
      api.get('/offers'),
      api.get('/analytics/hot-categories?limit=10'),
      api.get('/analytics/hot-subcategories?limit=10'),
      api.get('/analytics/featured-products?limit=3'),
      api.get('/analytics/featured-categories'),
      api.get('/analytics/best-selling?limit=5'),
      api.get('/banners'),
      api.get('/home-sections'),
    ])
      .then(
        ([
          offersRes,
          hotCatRes,
          hotSubcatRes,
          featuredProdRes,
          featuredCatRes,
          bestSellingRes,
          bannersRes,
          sectionsRes,
        ]) => {
          const data = {
            offerImage: offersRes.data[0]?.image || null,
            hotCategories: hotCatRes.data,
            hotSubcategories: hotSubcatRes.data,
            featuredProducts: featuredProdRes.data,
            featuredCategories: featuredCatRes.data,
            bestSelling: bestSellingRes.data,
            banners: bannersRes.data,
            sectionOrder: sectionsRes.data.length > 0 ? sectionsRes.data : DEFAULT_SECTION_ORDER,
          };
          setOfferImage(data.offerImage);
          setHotCategories(data.hotCategories);
          setHotSubcategories(data.hotSubcategories);
          setFeaturedProducts(data.featuredProducts);
          setFeaturedCategories(data.featuredCategories);
          setBestSelling(data.bestSelling);
          setBanners(data.banners);
          setSectionOrder(data.sectionOrder);
          setHomeCache(data);
        }
      )
      .finally(() => setLoading(false));
  }, [user]);

  // Keyed by section_key so the render order below can just walk
  // `sectionOrder` (as saved in Admin > Home Layout) instead of a fixed
  // JSX sequence. Each renderer takes the React `key` directly and returns
  // the section's own root element (or null) - no wrapping <div>, so a
  // section with no data to show renders nothing at all rather than an
  // empty spacer that `space-y-10` would still put a gap around.
  const sectionRenderers = {
    offer_banner: (key) => <OfferBannerSection key={key} offerImage={offerImage} />,
    hot_categories: (key) => <HotCategoriesSection key={key} hotCategories={hotCategories} />,
    featured_products: (key) => <FeaturedProductsSection key={key} featuredProducts={featuredProducts} />,
    featured_categories: (key) => (
      <FeaturedCategoriesSection key={key} featuredCategories={featuredCategories} />
    ),
    subcategory_spotlight: (key) => <SubcategorySpotlight key={key} subcategories={hotSubcategories} />,
    best_selling: (key) => <BestSellingSection key={key} bestSelling={bestSelling} />,
    banner_carousel: (key) => <BannerCarousel key={key} banners={banners} />,
    all_products: (key) => <AllProductsSection key={key} onEmptyChange={setProductsEmpty} />,
  };

  const hasCuratedContent =
    !!offerImage ||
    hotCategories.length > 0 ||
    hotSubcategories.length > 0 ||
    featuredProducts.length > 0 ||
    featuredCategories.length > 0 ||
    bestSelling.length > 0 ||
    banners.length > 0;
  const nothingConfigured = !hasCuratedContent && productsEmpty;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      {loading ? (
        <LoadingBlock className="py-16" />
      ) : nothingConfigured ? (
        <>
          <NotConfigured height="h-64" />
          <AllProductsSection onEmptyChange={setProductsEmpty} />
        </>
      ) : (
        <>
          {sectionOrder
            .filter((s) => s.is_visible)
            .map((s) => sectionRenderers[s.section_key]?.(s.section_key))}
        </>
      )}
    </div>
  );
}
