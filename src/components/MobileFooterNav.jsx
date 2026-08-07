import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faLayerGroup, faCartShopping, faUser } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const tabClass = ({ isActive }) =>
  `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[11px] font-medium ${
    isActive ? 'text-wa-green-dark dark:text-wa-green' : 'text-gray-500 dark:text-gray-400'
  }`;

export default function MobileFooterNav() {
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-2 inset-x-0 z-40 bg-white dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-800 flex">
      <NavLink to="/" end className={tabClass}>
        <FontAwesomeIcon icon={faHouse} className="text-lg" />
        Home
      </NavLink>
      <NavLink to="/categories" className={tabClass}>
        <FontAwesomeIcon icon={faLayerGroup} className="text-lg" />
        Categories
      </NavLink>
      <NavLink to="/cart" className={tabClass}>
        <span className="relative">
          <FontAwesomeIcon icon={faCartShopping} className="text-lg" />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-wa-green text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] leading-[16px] text-center px-1">
              {count}
            </span>
          )}
        </span>
        Cart
      </NavLink>
      <NavLink to={user ? '/profile' : '/login'} className={tabClass}>
        <FontAwesomeIcon icon={faUser} className="text-lg" />
        My Account
      </NavLink>
    </nav>
  );
}
