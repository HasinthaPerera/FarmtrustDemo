import React, { useState } from 'react';
import client, { setAuthToken } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await client.post('/auth/login', formData);

      // ── Diagnostic logs (safe to keep; useful for future debugging) ──────
      console.log('[Login] API RESPONSE:', res.data);

      // Persist the raw token for Authorization header use in other requests
      localStorage.setItem('token', res.data.token);

      // ── Extract user fields from the confirmed response shape ─────────────
      // Backend now returns: { token, user: { id, name, email, role } }
      // String() + toLowerCase() guards against null/undefined/mixed-case values.
      const rawRole = String(res.data.user?.role || '').toLowerCase() || 'buyer';
      const userData = {
        id:    res.data.user?.id    ?? null,
        name:  res.data.user?.name  || formData.email,
        email: res.data.user?.email || formData.email,
        role:  rawRole,
      };

      console.log('[Login] CONSTRUCTED USER:', userData);

      // Update global AuthContext state and persist to localStorage
      login(userData);
      setAuthToken(res.data.token);

      // ── Role → destination map ────────────────────────────────────────────
      // { replace: true } removes /login from history so Back button skips it.
      const ROLE_ROUTES = {
        farmer: '/farmer',
        admin:  '/admin',
        buyer:  '/buyer',
      };
      const destination = ROLE_ROUTES[userData.role] ?? '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // TODO: Integrate with Google OAuth (using google-auth-library or similar)
    // For now, this is a placeholder for Google OAuth implementation
    console.log('Google Sign-In clicked');
    // This will be connected to Google OAuth flow
    try {
      // Placeholder: Replace with actual Google OAuth implementation
      alert('Google Sign-In integration coming soon!');
    } catch (err) {
      setError('Google Sign-In failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-white to-primary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-start justify-center px-2 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="glass-card shadow-2xl border border-white/30 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 mb-3 text-white rounded-t-xl">
            <h2 className="text-lg font-display font-bold">FarmTrust Sign In</h2>
            <p className="text-xs opacity-90">Access your FarmTrust portal</p>
          </div>
          <div className="text-center mb-4 px-6">
            <img
              src="/main_logo.png"
              alt="FarmTrust logo"
              className="h-10 w-auto object-contain mx-auto mb-2"
            />
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 mb-1">Welcome Back</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg mb-4 text-xs mx-6">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="px-6">
            <div className="form-group mb-3">
              <label className="form-label dark:text-slate-300 text-sm">Email address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                onChange={onChange}
                required
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 text-sm py-2"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label dark:text-slate-300 text-sm">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                onChange={onChange}
                required
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 text-sm py-2"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mb-3 text-base py-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex justify-center px-6 mb-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 w-full max-w-xs rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path fill="#4285F4" d="M23.64 12.2c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-sm">Google</span>
            </button>
          </div>

          <div className="divider my-2 mx-6"></div>

          <p className="text-center text-slate-600 dark:text-slate-400 text-sm mb-4 px-6">
            Don't have an account? <Link to="/register" className="link-primary">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;