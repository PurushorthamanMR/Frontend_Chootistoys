import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPen,
  faCheck,
  faXmark,
  faUser,
  faLocationDot,
  faLock,
  faCartShopping,
  faHeart,
  faBox,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingBlock from '../components/LoadingBlock';
import { useWishlist } from '../context/WishlistContext';
import api from '../api/client';
import PasswordInput from '../components/PasswordInput';
import AvatarUpload from '../components/AvatarUpload';
import OtpInputModal from '../components/OtpInputModal';

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-wa-green/10 dark:bg-wa-green/15 text-wa-green-dark dark:text-wa-green flex items-center justify-center text-lg shrink-0">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function SectionCard({ icon, title, editing, onEdit, onCancel, onSave, saving, children }) {
  return (
    <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 font-bold text-wa-green-dark dark:text-wa-green">
          <FontAwesomeIcon icon={icon} />
          {title}
        </h3>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
              title="Cancel"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-300"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              aria-label="Save"
              title="Save"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-wa-green hover:bg-wa-green-dark disabled:opacity-60 text-white"
            >
              <FontAwesomeIcon icon={faCheck} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg"
          >
            <FontAwesomeIcon icon={faPen} size="xs" />
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="font-medium text-gray-900 dark:text-gray-100">{value || '-'}</p>
    </div>
  );
}

function TextInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">{label}</label>
      <input
        {...props}
        className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
      />
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile, sendChangeEmailOtp, verifyChangeEmailOtp } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [totalOrdered, setTotalOrdered] = useState(0);

  const [personalForm, setPersonalForm] = useState({ name: '', email: '', phone: '', shop_name: '' });
  const [addressForm, setAddressForm] = useState({ address: '', city: '' });
  const [passwordForm, setPasswordForm] = useState({ password: '' });

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isCustomer = user?.type === 'customer';
  const isSeller = user?.role === 'Seller';

  useEffect(() => {
    api
      .get('/auth/me')
      .then((res) => {
        setMe(res.data);
        setPersonalForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          shop_name: res.data.shop_name || '',
        });
        setAddressForm({ address: res.data.address || '', city: res.data.city || '' });
      })
      .finally(() => setLoading(false));

    api
      .get('/orders/mine')
      .then((res) => {
        const total = res.data.reduce(
          (sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0),
          0
        );
        setTotalOrdered(total);
      })
      .catch(() => {});
  }, []);

  function startEdit(section) {
    setError('');
    setEditingSection(section);
  }

  function cancelEdit() {
    setEditingSection(null);
    setError('');
    if (me) {
      setPersonalForm({
        name: me.name || '',
        email: me.email || '',
        phone: me.phone || '',
        shop_name: me.shop_name || '',
      });
      setAddressForm({ address: me.address || '', city: me.city || '' });
      setPasswordForm({ password: '' });
    }
  }

  async function savePersonal() {
    setError('');
    setSaving(true);
    try {
      // Email is handled separately below (OTP-gated) - name/phone/shop_name
      // don't need verification and save immediately.
      const payload = { name: personalForm.name, phone: personalForm.phone };
      if (isSeller) payload.shop_name = personalForm.shop_name;
      await updateProfile(payload);
      setMe((m) => ({ ...m, ...payload }));

      const currentEmail = me?.email || '';
      if (personalForm.email !== currentEmail) {
        await sendChangeEmailOtp(personalForm.email);
        setEditingSection('personal-email-otp');
      } else {
        setEditingSection(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function saveAddress() {
    setError('');
    setSaving(true);
    try {
      const payload = { address: addressForm.address };
      if (isSeller) payload.city = addressForm.city;
      await updateProfile(payload);
      setMe((m) => ({ ...m, ...payload }));
      setEditingSection(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (!passwordForm.password) {
      setEditingSection(null);
      return;
    }
    setError('');
    setSaving(true);
    try {
      await updateProfile({ password: passwordForm.password });
      setPasswordForm({ password: '' });
      setEditingSection(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  if (isSuperAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-8">
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">Super Admin</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is a fixed developer account and has no editable profile.
          </p>
        </div>
      </div>
    );
  }

  const location = !isCustomer && me?.address ? me.address : me?.phone;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <h2 className="text-xl font-bold text-wa-green-dark dark:text-wa-green">My Profile</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6 flex items-center gap-5">
        <AvatarUpload
          src={me?.image}
          onChange={async (url) => {
            await updateProfile({ image: url });
            setMe((m) => ({ ...m, image: url }));
          }}
          size="w-20 h-20"
        />
        <div className="min-w-0">
          <p className="font-bold text-lg text-wa-green-dark dark:text-wa-green truncate">{me?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role}</p>
          {location && <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{location}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={faCartShopping} label="Products in Cart" value={cartCount} />
        <StatCard icon={faHeart} label="Products in Wishlist" value={wishlistCount} />
        <StatCard icon={faBox} label="Total Products Ordered" value={totalOrdered} />
      </div>

      {editingSection === 'personal-email-otp' ? (
        <div className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none p-5 sm:p-6">
          <OtpInputModal
            identifier={personalForm.email}
            title="Verify your new email"
            onVerify={(code) => verifyChangeEmailOtp(personalForm.email, code)}
            onResend={() => sendChangeEmailOtp(personalForm.email)}
            onVerified={() => {
              setMe((m) => ({ ...m, email: personalForm.email }));
              setEditingSection(null);
            }}
            onBack={() => setEditingSection('personal')}
          />
        </div>
      ) : (
      <SectionCard
        icon={faUser}
        title="Personal Information"
        editing={editingSection === 'personal'}
        onEdit={() => startEdit('personal')}
        onCancel={cancelEdit}
        onSave={savePersonal}
        saving={saving}
      >
        {editingSection === 'personal' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextInput
              label="Name"
              required
              value={personalForm.name}
              onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
            />
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">User Role</label>
              <p className="px-3 py-2 text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
            <TextInput
              label="Email Address"
              type="email"
              required={!isCustomer}
              value={personalForm.email}
              onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
            />
            <TextInput
              label={isCustomer ? 'WhatsApp Number' : 'Phone Number'}
              required={isCustomer}
              value={personalForm.phone}
              onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
            />
            {isSeller && (
              <TextInput
                label="Shop Name"
                required
                value={personalForm.shop_name}
                onChange={(e) => setPersonalForm({ ...personalForm, shop_name: e.target.value })}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Name" value={me?.name} />
            <Field label="User Role" value={user?.role} />
            <Field label="Email Address" value={me?.email} />
            <Field label={isCustomer ? 'WhatsApp Number' : 'Phone Number'} value={me?.phone} />
            {isSeller && <Field label="Shop Name" value={me?.shop_name} />}
          </div>
        )}
      </SectionCard>
      )}

      {!isCustomer && (
        <SectionCard
          icon={faLocationDot}
          title="Address"
          editing={editingSection === 'address'}
          onEdit={() => startEdit('address')}
          onCancel={cancelEdit}
          onSave={saveAddress}
          saving={saving}
        >
          {editingSection === 'address' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextInput
                label="Address"
                value={addressForm.address}
                onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
              />
              {isSeller && (
                <TextInput
                  label="City"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Address" value={me?.address} />
              {isSeller && <Field label="City" value={me?.city} />}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard
        icon={faLock}
        title="Security"
        editing={editingSection === 'security'}
        onEdit={() => startEdit('security')}
        onCancel={cancelEdit}
        onSave={savePassword}
        saving={saving}
      >
        {editingSection === 'security' ? (
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">New Password</label>
            <PasswordInput
              minLength={6}
              value={passwordForm.password}
              onChange={(e) => setPasswordForm({ password: e.target.value })}
              className="w-full border border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100 rounded-lg px-3 py-2"
              placeholder="Leave blank to keep current password"
            />
          </div>
        ) : (
          <Field label="Password" value="••••••••" />
        )}
      </SectionCard>
    </div>
  );
}
