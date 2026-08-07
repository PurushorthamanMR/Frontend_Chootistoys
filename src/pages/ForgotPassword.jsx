import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import OtpInputModal from '../components/OtpInputModal';
import { authLabelClass, authInputClass, authButtonClass } from '../lib/authStyles';

export default function ForgotPassword() {
  const { sendForgotPasswordOtp, verifyForgotPasswordOtp, resetPassword } = useAuth();
  const [step, setStep] = useState('identifier');
  const [identifier, setIdentifier] = useState('');
  const [resolvedIdentifier, setResolvedIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleIdentifierSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await sendForgotPasswordOtp(identifier);
      setResolvedIdentifier(data.identifier);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setStep('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <OtpInputModal
        identifier={resolvedIdentifier}
        title="Verify it's you"
        onVerify={(code) => verifyForgotPasswordOtp(resolvedIdentifier, code)}
        onResend={() => sendForgotPasswordOtp(identifier)}
        onVerified={(data) => {
          setResetToken(data.resetToken);
          setStep('password');
        }}
        onBack={() => setStep('identifier')}
      />
    );
  }

  if (step === 'password') {
    return (
      <>
        <div className="hidden md:block">
          <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Set a new password</h2>
        </div>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <form onSubmit={handlePasswordSubmit} className="space-y-5 md:space-y-4">
          <div>
            <label className={authLabelClass}>New Password</label>
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div>
            <label className={authLabelClass}>Confirm Password</label>
            <PasswordInput
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={authInputClass}
            />
          </div>
          <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </>
    );
  }

  if (step === 'done') {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3 text-wa-green">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Password updated</h2>
        <p className="text-gray-600 dark:text-gray-400">You can now log in with your new password.</p>
        <Link to="/login" className="inline-block mt-4 text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Forgot Password</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your email or phone number and we'll send you a verification code.
        </p>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={handleIdentifierSubmit} className="space-y-5 md:space-y-4">
        <div>
          <label className={authLabelClass}>Email or Phone Number</label>
          <input required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className={authInputClass} />
        </div>
        <button type="submit" disabled={loading} className={`${authButtonClass} mt-2`}>
          {loading ? 'Sending code...' : 'Send Code'}
        </button>
      </form>
      <p className="text-sm text-center mt-6 md:mt-4 text-gray-500 dark:text-gray-400">
        <Link to="/login" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Back to Login
        </Link>
      </p>
    </>
  );
}
