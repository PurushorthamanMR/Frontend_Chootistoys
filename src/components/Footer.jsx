import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  const storeName = settings?.store_name || 'Soon';

  return (
    <footer className="hidden lg:block bg-wa-teal dark:bg-black text-gray-200 dark:text-gray-400 mt-12 dark:border-t dark:border-wa-green/30">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-4 gap-6 text-sm">
        <div>
          <h3 className="text-white font-bold mb-2">{storeName}</h3>
          <p>Sri Lanka's fun destination for toys, ride-ons, and kids' essentials.</p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Customer Care</h3>
          <ul className="space-y-1">
            <li>
              <Link to="/terms" className="hover:underline">Terms &amp; Conditions</Link>
            </li>
            <li>
              <Link to="/return-policy" className="hover:underline">Return Policy</Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Buy with Wholesale</h3>
          <Link to="/apply-seller" className="hover:underline">
            Become a Seller
          </Link>
        </div>
        <div>
          <h3 className="text-white font-bold mb-2">Contact</h3>
          <p>Address: {settings?.address || 'Soon'}</p>
          <p>Phone: {settings?.whatsapp_number || 'Soon'}</p>
          <p>Email: {settings?.email || 'Soon'}</p>
        </div>
      </div>
      <div className="text-center text-xs py-3 border-t border-white/10 dark:border-wa-green/20">
        &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
      </div>
    </footer>
  );
}
