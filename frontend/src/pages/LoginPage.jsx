import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { signInWithGoogle } from '../utils/firebase';
import useAuthStore from '../hooks/useAuthStore';

const TABS = ['email', 'google'];

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginSuccess, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState('email');
  const [loading, setLoading] = useState(false);

  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // ─── Email login ──────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      loginSuccess(data);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Google login ─────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const { data } = await api.post('/auth/google', { idToken });
      loginSuccess(data);
      toast.success(`Welcome, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Phone: send OTP via backend ─────────────────────────
  const handleSendOTP = async () => {
    if (!phone.match(/^\+[1-9]\d{7,14}$/)) {
      return toast.error('Enter phone in E.164 format: +919876543210');
    }
    setLoading(true);
    try {
      await api.post('/auth/phone/send-otp', { phone });
      setOtpSent(true);
      setCountdown(60);
      toast.success('OTP sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ─── Phone: verify OTP ────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error('Enter 6-digit OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/phone/verify-otp', { phone, otp });
      loginSuccess(data);
      toast.success('Phone verified! Welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>💡</span>
          <span style={styles.logoText}>Idea Validator</span>
        </div>
        <h1 style={styles.title}>Sign in to your account</h1>
        <p style={styles.subtitle}>Get brutal, honest feedback on your startup ideas</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === 'email' ? '✉️ Email' : t === 'google' ? '🔍 Google' : '📱 Phone'}
            </button>
          ))}
        </div>

        {/* ─── Email ─── */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '16px' }}>
              <Link to="/forgot-password" style={styles.link}>Forgot password?</Link>
            </div>
            <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ─── Google ─── */}
        {tab === 'google' && (
          <div style={styles.form}>
            <p style={{ color: '#a0a0c0', textAlign: 'center', marginBottom: '24px', lineHeight: 1.6 }}>
              Continue with your Google account. Fast, secure, and no password needed.
            </p>
            <button
              style={{ ...styles.btn, background: '#fff', color: '#333', border: '1px solid #ddd', opacity: loading ? 0.7 : 1 }}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10, verticalAlign: 'middle' }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {loading ? 'Connecting...' : 'Continue with Google'}
            </button>
          </div>
        )}

        {/* ─── Phone ─── */}
        {tab === 'phone' && (
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Phone Number (with country code)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={{ ...styles.input, flex: 1 }}
                  type="tel"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  disabled={otpSent}
                />
                <button
                  type="button"
                  style={{ ...styles.btn, width: 'auto', padding: '0 16px', fontSize: '0.8rem', opacity: (loading || countdown > 0) ? 0.6 : 1 }}
                  onClick={handleSendOTP}
                  disabled={loading || countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : 'Send OTP'}
                </button>
              </div>
            </div>
            {otpSent && (
              <div style={styles.field}>
                <label style={styles.label}>Enter 6-digit OTP</label>
                <input
                  style={{ ...styles.input, letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
                <p style={{ color: '#6a6a8a', fontSize: '0.75rem', marginTop: 6 }}>
                  OTP sent to {phone}
                </p>
              </div>
            )}
            {otpSent && (
              <button style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            )}
          </form>
        )}

        <p style={{ textAlign: 'center', color: '#6a6a8a', marginTop: 24, fontSize: '0.85rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#111118', border: '1px solid #2a2a3a', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 440 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoIcon: { fontSize: 28, background: '#e8c547', borderRadius: 8, padding: '4px 8px' },
  logoText: { fontSize: '1.1rem', fontWeight: 700, color: '#e8e8f0', fontFamily: 'serif' },
  title: { color: '#e8e8f0', fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 },
  subtitle: { color: '#6a6a8a', fontSize: '0.88rem', marginBottom: 28 },
  tabs: { display: 'flex', background: '#0a0a0f', borderRadius: 10, padding: 4, marginBottom: 28, gap: 4 },
  tab: { flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6a6a8a', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.2s' },
  tabActive: { background: '#1a1a24', color: '#e8c547', border: '1px solid #2a2a3a' },
  form: { display: 'flex', flexDirection: 'column' },
  field: { marginBottom: 18 },
  label: { display: 'block', color: '#a0a0c0', fontSize: '0.82rem', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 10, padding: '12px 14px', color: '#e8e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '13px', background: '#e8c547', color: '#0a0a0f', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  link: { color: '#e8c547', textDecoration: 'none', fontWeight: 500 }
};
