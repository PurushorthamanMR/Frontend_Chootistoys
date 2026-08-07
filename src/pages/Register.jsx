import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import FieldStatus from '../components/FieldStatus';
import AvatarUpload from '../components/AvatarUpload';
import OtpInputModal from '../components/OtpInputModal';
import { useDuplicateCheck } from '../lib/useDuplicateCheck';
import { isValidEmail } from '../lib/validators';
import { authLabelClass, authInputClass, authButtonClass } from '../lib/authStyles';

export default function Register() {
  const { sendRegisterOtp, verifyRegisterOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', whatsapp_number: '', email: '', password: '', image: '' });
  const [step, setStep] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const phoneStatus = useDuplicateCheck('/customers/check', form.whatsapp_number, {
    extraParams: { field: 'phone' },
    skip: !form.whatsapp_number,
  });
  const emailStatus = useDuplicateCheck('/customers/check', form.email, {
    extraParams: { field: 'email' },
    skip: !form.email || !isValidEmail(form.email),
  });
  const emailInvalid = !!form.email && !isValidEmail(form.email);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (phoneStatus === 'duplicate') {
      setError('An account with this WhatsApp number already exists');
      return;
    }
    if (emailInvalid) {
      setError('Enter a valid email address');
      return;
    }
    if (emailStatus === 'duplicate') {
      setError('An account with this email already exists');
      return;
    }
    setLoading(true);
    try {
      await sendRegisterOtp(form);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'otp') {
    return (
      <OtpInputModal
        identifier={form.email}
        title="Verify your email"
        onVerify={(code) => verifyRegisterOtp(form.email, code)}
        onResend={() => sendRegisterOtp(form)}
        onVerified={() => navigate('/')}
        onBack={() => setStep('form')}
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-gray-100">Create an Account</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Register to start shopping with us.</p>
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
          <label className={authLabelClass}>WhatsApp Number</label>
          <input
            required
            placeholder="e.g. 94771234567"
            value={form.whatsapp_number}
            onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })}
            className={authInputClass}
          />
          <FieldStatus status={phoneStatus} duplicateMessage="An account with this WhatsApp number already exists" />
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
          disabled={loading || phoneStatus === 'duplicate' || emailStatus === 'duplicate' || emailInvalid}
          className={`${authButtonClass} mt-2`}
        >
          {loading ? 'Sending code...' : 'Register'}
        </button>
      </form>
      <p className="text-sm text-center mt-6 md:mt-4 text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="text-wa-green-dark dark:text-wa-green font-bold hover:underline">
          Login
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
