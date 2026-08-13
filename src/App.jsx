import { Routes, Route, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import CustomScrollbar from './components/CustomScrollbar';
import Footer from './components/Footer';
import FloatingOrderBar from './components/FloatingOrderBar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import MobileFooterNav from './components/MobileFooterNav';
import AuthLayout from './components/AuthLayout';
import LoadingBlock from './components/LoadingBlock';
import { PrivateRoute, AdminRoute, PosRoute } from './components/RouteGuards';

// Route-level code splitting - each lazy() call becomes its own chunk, so a
// customer visiting the storefront never downloads the Admin or POS bundles
// (and vice versa). Keeps the main bundle under Vite's 500kB warning without
// hand-rolled manualChunks tuning.
const Home = lazy(() => import('./pages/Home'));
const ProductList = lazy(() => import('./pages/ProductList'));
const Categories = lazy(() => import('./pages/Categories'));
const Blogs = lazy(() => import('./pages/Blogs'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const SellerLogin = lazy(() => import('./pages/SellerLogin'));
const Register = lazy(() => import('./pages/Register'));
const ApplySeller = lazy(() => import('./pages/ApplySeller'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const WholesaleView = lazy(() => import('./pages/WholesaleView'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const PosLayout = lazy(() => import('./pages/pos/PosLayout'));
const Pos = lazy(() => import('./pages/pos/Pos'));
const PosSalesHistory = lazy(() => import('./pages/pos/PosSalesHistory'));
const PosDailySummary = lazy(() => import('./pages/pos/PosDailySummary'));
const PosXReport = lazy(() => import('./pages/pos/PosXReport'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminProductDetail = lazy(() => import('./pages/admin/AdminProductDetail'));
const AdminProductEdit = lazy(() => import('./pages/admin/AdminProductEdit'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCategoryDetail = lazy(() => import('./pages/admin/AdminCategoryDetail'));
const AdminCategoryEdit = lazy(() => import('./pages/admin/AdminCategoryEdit'));
const AdminSubcategories = lazy(() => import('./pages/admin/AdminSubcategories'));
const AdminSubcategoryDetail = lazy(() => import('./pages/admin/AdminSubcategoryDetail'));
const AdminSubcategoryEdit = lazy(() => import('./pages/admin/AdminSubcategoryEdit'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/AdminOrderDetail'));
const AdminOrderEdit = lazy(() => import('./pages/admin/AdminOrderEdit'));
const AdminLowStock = lazy(() => import('./pages/admin/AdminLowStock'));
const AdminLowStockEdit = lazy(() => import('./pages/admin/AdminLowStockEdit'));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminBlogDetail = lazy(() => import('./pages/admin/AdminBlogDetail'));
const AdminBlogEdit = lazy(() => import('./pages/admin/AdminBlogEdit'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminOfferDetail = lazy(() => import('./pages/admin/AdminOfferDetail'));
const AdminOfferEdit = lazy(() => import('./pages/admin/AdminOfferEdit'));
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'));
const AdminBannerDetail = lazy(() => import('./pages/admin/AdminBannerDetail'));
const AdminBannerEdit = lazy(() => import('./pages/admin/AdminBannerEdit'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminUserDetail = lazy(() => import('./pages/admin/AdminUserDetail'));
const AdminUserEdit = lazy(() => import('./pages/admin/AdminUserEdit'));
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/AdminCustomerDetail'));
const AdminCustomerEdit = lazy(() => import('./pages/admin/AdminCustomerEdit'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminDocumentation = lazy(() => import('./pages/admin/AdminDocumentation'));
const PageNotFound = lazy(() => import('./pages/PageNotFound'));

// Every real route this app serves. Used only to tell "a valid page loaded
// directly via URL/refresh/bookmark" apart from "an unknown/typo URL" - the
// former bounces to Home, the latter falls through to the 404 route below.
const KNOWN_PATHS = [
  '/', '/products', '/products/:slug', '/categories', '/blogs', '/cart',
  '/login', '/seller-login', '/register', '/apply-seller', '/forgot-password',
  '/checkout', '/my-orders', '/profile', '/wishlist',
  '/terms', '/return-policy', '/privacy-policy', '/about-us',
  '/admin', '/admin/dashboard', '/admin/products', '/admin/categories', '/admin/subcategories', '/admin/orders',
  '/admin/low-stock', '/admin/blogs', '/admin/offers', '/admin/banners', '/admin/users', '/admin/customers',
  '/admin/settings', '/admin/documentation',
  '/pos', '/pos/sales-history', '/pos/daily-summary', '/pos/x-report',
];

const AUTH_PATHS = ['/login', '/register', '/apply-seller', '/seller-login', '/forgot-password'];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasMountedRef = useRef(false);
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = AUTH_PATHS.includes(location.pathname);
  const isWholesaleRoute = location.pathname.startsWith('/wholesale-view/');
  const isPosRoute = location.pathname.startsWith('/pos');
  const isHomeRoute = location.pathname === '/';

  // Pages should only be reached by clicking something inside the running app.
  // App only remounts on a genuine fresh page load (typed URL, refresh, bookmark,
  // shared link) - never on in-app navigation - so this only fires for that case.
  // Exceptions: /admin/* (OAuth return + admin refresh) and wholesale share links.
  useLayoutEffect(() => {
    if (hasMountedRef.current) return;
    hasMountedRef.current = true;

    const params = new URLSearchParams(location.search);
    const driveResult = params.get('drive');
    // Google OAuth sometimes lands on "/" if an older redirect bounced here —
    // send the result back to Settings so the success/error popup can show.
    if (
      location.pathname === '/' &&
      (driveResult === 'connected' || driveResult === 'error')
    ) {
      const reason = params.get('reason');
      navigate(
        `/admin/settings?tab=drive&drive=${driveResult}${
          reason ? `&reason=${encodeURIComponent(reason)}` : ''
        }`,
        { replace: true }
      );
      return;
    }

    if (location.pathname.startsWith('/admin')) return;
    if (location.pathname.startsWith('/wholesale-view/')) return;
    if (location.pathname.startsWith('/pos')) return;

    const isKnownPath = KNOWN_PATHS.some((pattern) => matchPath(pattern, location.pathname));
    if (isKnownPath && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Admin pages render their own <position: fixed> overlays (the mobile
  // sidebar drawer). A `transform` on any ancestor becomes the containing
  // block for those per the CSS spec, so admin routes deliberately skip the
  // page-transition motion.div below (which sets `y` = a transform) -
  // otherwise the drawer's height resolves against the animated wrapper's
  // content height instead of the real viewport, breaking its scrolling.
  const routesElement = (
    <Suspense fallback={<LoadingBlock className="py-24" />}>
    <Routes location={location}>
      <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/blogs" element={<Blogs />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/seller-login" element={<SellerLogin />} />
                <Route path="/register" element={<Register />} />
                <Route path="/apply-seller" element={<ApplySeller />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route
                path="/checkout"
                element={
                  <PrivateRoute>
                    <Checkout />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-orders"
                element={
                  <PrivateRoute>
                    <MyOrders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/wishlist"
                element={
                  <PrivateRoute>
                    <Wishlist />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/:id" element={<AdminProductDetail />} />
                <Route path="products/:id/edit" element={<AdminProductEdit />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="categories/:id" element={<AdminCategoryDetail />} />
                <Route path="categories/:id/edit" element={<AdminCategoryEdit />} />
                <Route path="subcategories" element={<AdminSubcategories />} />
                <Route path="subcategories/:id" element={<AdminSubcategoryDetail />} />
                <Route path="subcategories/:id/edit" element={<AdminSubcategoryEdit />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="orders/:id" element={<AdminOrderDetail />} />
                <Route path="orders/:id/edit" element={<AdminOrderEdit />} />
                <Route path="low-stock" element={<AdminLowStock />} />
                <Route path="low-stock/:id/edit" element={<AdminLowStockEdit />} />
                <Route path="blogs" element={<AdminBlogs />} />
                <Route path="blogs/:id" element={<AdminBlogDetail />} />
                <Route path="blogs/:id/edit" element={<AdminBlogEdit />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="offers/:id" element={<AdminOfferDetail />} />
                <Route path="offers/:id/edit" element={<AdminOfferEdit />} />
                <Route path="banners" element={<AdminBanners />} />
                <Route path="banners/:id" element={<AdminBannerDetail />} />
                <Route path="banners/:id/edit" element={<AdminBannerEdit />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="users/:id/edit" element={<AdminUserEdit />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="customers/:id" element={<AdminCustomerDetail />} />
                <Route path="customers/:id/edit" element={<AdminCustomerEdit />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="documentation" element={<AdminDocumentation />} />
              </Route>
              <Route
                path="/pos"
                element={
                  <PosRoute>
                    <PosLayout />
                  </PosRoute>
                }
              >
                <Route index element={<Pos />} />
                <Route path="sales-history" element={<PosSalesHistory />} />
                <Route path="daily-summary" element={<PosDailySummary />} />
                <Route path="x-report" element={<PosXReport />} />
              </Route>
              <Route path="/wholesale-view/:token" element={<WholesaleView />} />
              <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );

  return (
    <div className={`min-h-screen flex flex-col bg-white dark:bg-black transition-colors ${isPosRoute ? 'h-dvh max-h-dvh overflow-hidden' : ''}`}>
      <CustomScrollbar />
      {!isAdminRoute && !isAuthRoute && !isWholesaleRoute && !isPosRoute && <Navbar />}
      <main
        className={
          isPosRoute
            ? 'flex-1 min-h-0 overflow-hidden'
            : isAdminRoute || isAuthRoute || isWholesaleRoute
              ? 'flex-1'
              : 'flex-1 pb-32 lg:pb-24'
        }
      >
        {isAdminRoute || isPosRoute ? (
          routesElement
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={isAuthRoute ? '__auth__' : location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {routesElement}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      {!isAdminRoute && !isAuthRoute && !isWholesaleRoute && !isPosRoute && <FloatingOrderBar />}
      {isHomeRoute && <FloatingWhatsApp />}
      {!isAdminRoute && !isAuthRoute && !isWholesaleRoute && !isPosRoute && <MobileFooterNav />}
      {!isAdminRoute && !isAuthRoute && !isWholesaleRoute && !isPosRoute && <Footer />}
    </div>
  );
}

export default App;
