import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { clearHomeCache } from '../lib/homeCache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ccs_token') || sessionStorage.getItem('ccs_token');
    const storedUser = localStorage.getItem('ccs_user') || sessionStorage.getItem('ccs_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function login(token, userData, remember = true) {
    const store = remember ? localStorage : sessionStorage;
    store.setItem('ccs_token', token);
    store.setItem('ccs_user', JSON.stringify(userData));
    clearHomeCache();
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('ccs_token');
    localStorage.removeItem('ccs_user');
    sessionStorage.removeItem('ccs_token');
    sessionStorage.removeItem('ccs_user');
    clearHomeCache();
    setUser(null);
  }

  // Customer registration - two-step, email-OTP-gated.
  async function sendRegisterOtp(payload) {
    const { data } = await api.post('/auth/register/send-otp', payload);
    return data;
  }
  async function verifyRegisterOtp(email, code) {
    const { data } = await api.post('/auth/register/verify-otp', { email, code });
    login(data.token, data.user);
    return data;
  }

  // Seller application - two-step, email-OTP-gated.
  async function sendSellerOtp(payload) {
    const { data } = await api.post('/auth/apply-seller/send-otp', payload);
    return data;
  }
  async function verifySellerOtp(email, code) {
    const { data } = await api.post('/auth/apply-seller/verify-otp', { email, code });
    return data;
  }

  // Forgot password - identifier -> OTP -> reset.
  async function sendForgotPasswordOtp(identifier) {
    const { data } = await api.post('/auth/forgot-password/send-otp', { identifier });
    return data;
  }
  async function verifyForgotPasswordOtp(identifier, code) {
    const { data } = await api.post('/auth/forgot-password/verify-otp', { identifier, code });
    return data;
  }
  async function resetPassword(resetToken, password) {
    const { data } = await api.post('/auth/forgot-password/reset', { resetToken, password });
    return data;
  }

  async function signIn(identifier, password, remember = true) {
    const { data } = await api.post('/auth/login', { identifier, password });
    login(data.token, data.user, remember);
    return data;
  }

  // Changing your own email (Profile page) - OTP-gated, unlike the rest of
  // updateProfile, since it changes the identifier used to log in/recover.
  async function sendChangeEmailOtp(email) {
    const { data } = await api.post('/auth/change-email/send-otp', { email });
    return data;
  }
  async function verifyChangeEmailOtp(email, code) {
    const { data } = await api.post('/auth/change-email/verify-otp', { email, code });
    const updatedUser = { ...user, email: data.email };
    const store = localStorage.getItem('ccs_token') ? localStorage : sessionStorage;
    store.setItem('ccs_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/auth/me', payload);
    const updatedUser = { ...user, ...payload };
    delete updatedUser.password;
    const store = localStorage.getItem('ccs_token') ? localStorage : sessionStorage;
    store.setItem('ccs_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        signIn,
        updateProfile,
        sendRegisterOtp,
        verifyRegisterOtp,
        sendSellerOtp,
        verifySellerOtp,
        sendForgotPasswordOtp,
        verifyForgotPasswordOtp,
        resetPassword,
        sendChangeEmailOtp,
        verifyChangeEmailOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
