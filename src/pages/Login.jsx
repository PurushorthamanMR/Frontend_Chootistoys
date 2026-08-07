import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { authLabelClass, authInputClass, authButtonClass } from '../lib/authStyles';
import api from '../api/client';

export default function Login() {
  const { signIn } = useAuth();
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
      const { user } = await signIn(identifier, password, remember);
      if (user.role === 'Admin') {
        // First-time-use nudge (Admin only - SuperAdmin is the developer role
        // and always goes straight to the Dashboard): send them to finish
        // initial store setup until every Settings section is filled in.
        // Fail closed: if setup-status can't be loaded, treat as incomplete
        // so they never land on the full admin panel by accident.
        let setupComplete = false;
        try {
          const { data } = await api.get('/settings/setup-status');
          setupComplete = data?.percent === 100;
        } catch {
          setupComplete = false;
        }
        navigate(setupComplete ? '/admin' : '/admin/settings?tab=drive');
      } else if (user.role === 'SuperAdmin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="hidden md:block">
        <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Login</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your details to access your account.</p>
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
          <Link to="/forgot-password" className="text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-sm text-center mt-6 md:mt-4 text-gray-500 dark:text-gray-400">
        Don't have an account?{' '}
        <Link to="/register" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Register
        </Link>
      </p>
      <p className="text-sm text-center mt-2 text-gray-500 dark:text-gray-400">
        Want to be a seller?{' '}
        <Link to="/apply-seller" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Apply as a Seller
        </Link>
      </p>
    </>
  );
}
