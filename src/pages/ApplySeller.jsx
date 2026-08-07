import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import FieldStatus from '../components/FieldStatus';
import AvatarUpload from '../components/AvatarUpload';
import OtpInputModal from '../components/OtpInputModal';
import { useDuplicateCheck } from '../lib/useDuplicateCheck';
import { isValidEmail } from '../lib/validators';
import { authLabelClass, authInputClass, authButtonClass } from '../lib/authStyles';

export default function ApplySeller() {
  const { sendSellerOtp, verifySellerOtp } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', password: '', shop_name: '', city: '', image: '' });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailInvalid = !!form.email && !isValidEmail(form.email);
  const emailStatus = useDuplicateCheck('/users/check', form.email, {
    extraParams: { field: 'email' },
    skip: !form.email || emailInvalid,
  });
  const mobileStatus = useDuplicateCheck('/users/check', form.mobile, {
    extraParams: { field: 'phone' },
    skip: !form.mobile,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (emailInvalid) {
      setError('Enter a valid email address');
      return;
    }
    if (emailStatus === 'duplicate') {
      setError('An account with this email already exists');
      return;
    }
    if (mobileStatus === 'duplicate') {
      setError('An account with this mobile number already exists');
      return;
    }
    setLoading(true);
    try {
      await sendSellerOtp(form);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  }

  function handleVerified(data) {
    if (data.whatsapp?.number) {
      // Navigate the current tab rather than pre-opening a blank one and
      // redirecting it later - on mobile browsers (notably iOS Safari)
      // that pattern leaves the new tab stuck on about:blank because the
      // window handle can't be navigated after the async request resolves.
      // A same-tab location change isn't subject to popup blocking at all.
      const href = `https://wa.me/${data.whatsapp.number}?text=${encodeURIComponent(data.whatsapp.text)}`;
      window.location.href = href;
    } else {
      setSubmitted(true);
    }
  }

  if (step === 'otp') {
    return (
      <OtpInputModal
        identifier={form.email}
        title="Verify your email"
        onVerify={(code) => verifySellerOtp(form.email, code)}
        onResend={() => sendSellerOtp(form)}
        onVerified={handleVerified}
        onBack={() => setStep('form')}
      />
    );
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-3 text-wa-green"><FontAwesomeIcon icon={faCircleCheck} /></div>
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Application sent to admin</h2>
        <p className="text-gray-600 dark:text-gray-400">
          After verification you will get a message, then you can use your Seller account.
        </p>
        <Link to="/" className="inline-block mt-4 text-wa-green-dark dark:text-wa-green font-semibold hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Apply as a Seller</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Submit your details and our admin will review your application.
        </p>
      </div>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-4">
        <div className="flex justify-center">
          <AvatarUpload src={form.image} onChange={(url) => setForm({ ...form, image: url })} size="w-20 h-20" />
        </div>
        <div>
          <label className={authLabelClass}>Full Name</label>
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={authInputClass}
          />
        </div>
        <div>
          <label className={authLabelClass}>Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={authInputClass}
          />
          <FieldStatus
            status={emailStatus}
            duplicateMessage="An account with this email already exists"
            invalid={emailInvalid}
            invalidMessage="Enter a valid email address"
          />
        </div>
        <div>
          <label className={authLabelClass}>Mobile</label>
          <input
            required
            placeholder="e.g. 94771234567"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className={authInputClass}
          />
          <FieldStatus status={mobileStatus} duplicateMessage="An account with this mobile number already exists" />
        </div>
        <div>
          <label className={authLabelClass}>Shop Name</label>
          <input
            required
            value={form.shop_name}
            onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
            className={authInputClass}
          />
        </div>
        <div>
          <label className={authLabelClass}>City</label>
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={authInputClass}
          />
        </div>
        <div>
          <label className={authLabelClass}>Password</label>
          <PasswordInput
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={authInputClass}
          />
        </div>
        <button
          type="submit"
          disabled={loading || emailInvalid || emailStatus === 'duplicate' || mobileStatus === 'duplicate'}
          className={`${authButtonClass} mt-2`}
        >
          {loading ? 'Sending code...' : 'Apply'}
        </button>
      </form>
      <p className="text-sm text-center mt-6 md:mt-4 text-gray-500 dark:text-gray-400">
        <Link to="/register" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Register as a Customer instead
        </Link>
      </p>
    </>
  );
}
