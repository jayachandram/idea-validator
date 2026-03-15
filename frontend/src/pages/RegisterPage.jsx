import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { signInWithGoogle } from '../utils/firebase';
import useAuthStore from '../hooks/useAuthStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });
      setRegistered(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const { data } = await api.post('/auth/google', { idToken });
      loginSuccess(data);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>📬</div>
          <h2 style={{ color: '#e8e8f0', marginBottom: 12, fontSize: '1.5rem' }}>Check your inbox!</h2>
          <p style={{ color: '#a0a0c0', lineHeight: 1.7, marginBottom: 24 }}>
            We sent a verification link to <strong style={{ color: '#e8c547' }}>{form.email}</strong>. Click it to activate your account.
          </p>
          <Link to="/login" style={{ color: '#e8c547', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={{ fontSize: 28, background: '#e8c547', borderRadius: 8, padding: '4px 8px' }}>💡</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e8f0', fontFamily: 'serif' }}>Idea Validator</span>
        </div>
        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Free forever. No credit card required.</p>

        <button
          style={{ ...styles.btn, background: '#fff', color: '#333', border: '1px solid #ddd', marginBottom: 24, opacity: loading ? 0.7 : 1 }}
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10, verticalAlign: 'middle' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
          <span style={{ color: '#6a6a8a', fontSize: '0.8rem' }}>or with email</span>
          <div style={{ flex: 1, height: 1, background: '#2a2a3a' }} />
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your name' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '8+ chars, upper, lower, number' },
            { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: '••••••••' }
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={styles.label}>{label}</label>
              <input
                style={styles.input}
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={set(key)}
                required
              />
            </div>
          ))}

          <button style={{ ...styles.btn, marginTop: 8, opacity: loading ? 0.7 : 1 }} disabled={loading} type="submit">
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#6a6a8a', marginTop: 20, fontSize: '0.85rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#e8c547', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: "'DM Sans', sans-serif" },
  card: { background: '#111118', border: '1px solid #2a2a3a', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 440 },
  logo: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  title: { color: '#e8e8f0', fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 },
  subtitle: { color: '#6a6a8a', fontSize: '0.88rem', marginBottom: 24 },
  label: { display: 'block', color: '#a0a0c0', fontSize: '0.82rem', marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', background: '#0a0a0f', border: '1px solid #2a2a3a', borderRadius: 10, padding: '12px 14px', color: '#e8e8f0', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  btn: { width: '100%', padding: '13px', background: '#e8c547', color: '#0a0a0f', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }
};
