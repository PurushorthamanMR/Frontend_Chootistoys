import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import PasswordInput from '../components/PasswordInput';
import api from '../api/client';
import { infoAlert } from '../lib/alert';
import { authLabelClass, authInputClass, authButtonClass } from '../lib/authStyles';

export default function SellerLogin() {
  const { signIn } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(identifier, password, remember);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    let number = null;
    try {
      const { data } = await api.get('/whatsapp/contact');
      number = data.number;
    } catch {
      number = null;
    }
    const storeName = settings?.store_name || 'City Cycle Stores Toys';
    const waHref = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(
          `Hi, I forgot my password for my ${storeName} seller account and need help resetting it.`
        )}`
      : null;
    infoAlert(
      'Forgot your password?',
      waHref
        ? `Self-service reset isn't available yet. <a href="${waHref}" target="_blank" rel="noopener noreferrer" class="text-wa-green-dark dark:text-wa-green font-semibold underline">Message us on WhatsApp</a> and our seller support team will help you regain access.`
        : "Self-service reset isn't available yet. Please contact our seller support team for help regaining access to your account."
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Seller Login</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Sign in to manage your listings and orders.</p>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
        <div>
          <label className={authLabelClass}>WhatsApp Number</label>
          <input
            type="text"
            autoComplete="username"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div>
          <label className={authLabelClass}>Password</label>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-neutral-600 text-wa-green focus:ring-wa-green"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline"
          >
            Forgot password?
          </button>
        </div>
        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? 'Logging in...' : 'Login to Seller Portal'}
        </button>
      </form>
      <p className="text-sm text-center mt-6 md:mt-4 text-gray-500 dark:text-gray-400">
        Not a seller yet?{' '}
        <Link to="/apply-seller" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Apply as a Seller
        </Link>
      </p>
      <p className="text-sm text-center mt-2 text-gray-500 dark:text-gray-400">
        Shopping instead?{' '}
        <Link to="/login" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Customer Login
        </Link>
      </p>
    </>
  );
}
