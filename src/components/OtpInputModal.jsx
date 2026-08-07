import { useEffect, useRef, useState } from 'react';
import { authButtonClass } from '../lib/authStyles';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

// Reusable 6-digit OTP entry step, used by Register, ApplySeller and
// ForgotPassword. The parent owns the actual API calls - `onVerify(code)`
// and `onResend()` should return promises (axios calls), this component
// only handles the digit-box UI, resend cooldown, and error display.
export default function OtpInputModal({ identifier, title = 'Verify your email', onVerify, onResend, onVerified, onBack }) {
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function handleDigitChange(index, value) {
    const clean = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < CODE_LENGTH; i++) next[i] = pasted[i] || '';
      return next;
    });
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleVerify(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const data = await onVerify(code);
      onVerified(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      await onResend();
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          We sent a 6-digit code to <span className="font-medium text-gray-700 dark:text-gray-300">{identifier}</span>
        </p>
      </div>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="w-11 h-12 text-center text-lg font-bold border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-md focus:outline-none focus:border-wa-green focus:ring-1 focus:ring-wa-green"
          />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <button type="submit" disabled={verifying} className={authButtonClass}>
        {verifying ? 'Verifying...' : 'Verify'}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onBack} className="text-gray-500 dark:text-gray-400 hover:underline">
          Change details
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-wa-green-dark dark:text-wa-green font-medium hover:underline disabled:opacity-50 disabled:hover:no-underline"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Resending...' : 'Resend code'}
        </button>
      </div>
    </form>
  );
}
