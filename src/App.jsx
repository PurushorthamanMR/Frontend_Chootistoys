import { Routes, Route, useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import CustomScrollbar from './components/CustomScrollbar';
import Footer from './components/Footer';
import FloatingOrderBar from './components/FloatingOrderBar';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import MobileFooterNav from './components/MobileFooterNav';
import AuthLayout from './components/AuthLayout';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import Categories from './pages/Categories';
import Blogs from './pages/Blogs';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import SellerLogin from './pages/SellerLogin';
import Register from './pages/Register';
import ApplySeller from './pages/ApplySeller';
import ForgotPassword from './pages/ForgotPassword';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import WholesaleView from './pages/WholesaleView';
import TermsConditions from './pages/TermsConditions';
import ReturnPolicy from './pages/ReturnPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import { PrivateRoute, AdminRoute, PosRoute } from './components/RouteGuards';
import PosLayout from './pages/pos/PosLayout';
import Pos from './pages/pos/Pos';
import PosSalesHistory from './pages/pos/PosSalesHistory';
import PosDailySummary from './pages/pos/PosDailySummary';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductDetail from './pages/admin/AdminProductDetail';
import AdminProductEdit from './pages/admin/AdminProductEdit';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCategoryDetail from './pages/admin/AdminCategoryDetail';
import AdminCategoryEdit from './pages/admin/AdminCategoryEdit';
import AdminSubcategories from './pages/admin/AdminSubcategories';
import AdminSubcategoryDetail from './pages/admin/AdminSubcategoryDetail';
import AdminSubcategoryEdit from './pages/admin/AdminSubcategoryEdit';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminOrderEdit from './pages/admin/AdminOrderEdit';
import AdminLowStock from './pages/admin/AdminLowStock';
import AdminLowStockEdit from './pages/admin/AdminLowStockEdit';
import AdminBlogs from './pages/admin/AdminBlogs';
import AdminBlogDetail from './pages/admin/AdminBlogDetail';
import AdminBlogEdit from './pages/admin/AdminBlogEdit';
import AdminOffers from './pages/admin/AdminOffers';
import AdminOfferDetail from './pages/admin/AdminOfferDetail';
import AdminOfferEdit from './pages/admin/AdminOfferEdit';
import AdminBanners from './pages/admin/AdminBanners';
import AdminBannerDetail from './pages/admin/AdminBannerDetail';
import AdminBannerEdit from './pages/admin/AdminBannerEdit';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminUserEdit from './pages/admin/AdminUserEdit';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail';
import AdminCustomerEdit from './pages/admin/AdminCustomerEdit';
import AdminSettings from './pages/admin/AdminSettings';
import AdminDocumentation from './pages/admin/AdminDocumentation';
import PageNotFound from './pages/PageNotFound';

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
  '/pos', '/pos/sales-history', '/pos/daily-summary',
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
              </Route>
              <Route path="/wholesale-view/:token" element={<WholesaleView />} />
              <Route path="*" element={<PageNotFound />} />
    </Routes>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black transition-colors">
      <CustomScrollbar />
      {!isAdminRoute && !isAuthRoute && !isWholesaleRoute && !isPosRoute && <Navbar />}
      <main className={isAdminRoute || isAuthRoute || isWholesaleRoute || isPosRoute ? 'flex-1' : 'flex-1 pb-32 lg:pb-24'}>
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
