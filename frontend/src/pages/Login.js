import React, { useState, useEffect } from 'react';
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
      const rawRole = String(res.data.user?.role || '').toLowerCase() || 'buyer';
      const userData = {
        id: res.data.user?.id ?? null,
        name: res.data.user?.name || formData.email,
        email: res.data.user?.email || formData.email,
        role: rawRole,
      };

      console.log('[Login] CONSTRUCTED USER:', userData);

      // Update global AuthContext state and persist to localStorage
      login(userData);
      setAuthToken(res.data.token);

      // ── Role → destination map ────────────────────────────────────────────
      const ROLE_ROUTES = {
        farmer: '/farmer',
        admin: '/admin',
        buyer: '/buyer',
      };
      const destination = ROLE_ROUTES[userData.role] ?? '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      setLoading(false);
    }
  };

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/google', { token: response.credential });
      console.log('[Google Login] API RESPONSE:', res.data);

      localStorage.setItem('token', res.data.token);
      const rawRole = String(res.data.user?.role || '').toLowerCase() || 'buyer';
      const userData = {
        id: res.data.user?.id ?? null,
        name: res.data.user?.name || res.data.user?.email,
        email: res.data.user?.email,
        role: rawRole,
      };

      console.log('[Google Login] CONSTRUCTED USER:', userData);
      login(userData);
      setAuthToken(res.data.token);

      const ROLE_ROUTES = {
        farmer: '/farmer',
        admin: '/admin',
        buyer: '/buyer',
      };
      const destination = ROLE_ROUTES[userData.role] ?? '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Google Sign-In failed');
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const btnContainer = document.getElementById("googleSignInDiv");
      if (window.google && btnContainer) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '968903403453-5idtlom7pl374q09t3l8jruddv1htbci.apps.googleusercontent.com',
          callback: handleCredentialResponse
        });
        window.google.accounts.id.renderButton(
          btnContainer,
          { theme: "outline", size: "large", width: "380", text: "continue_with" }
        );
        return true;
      }
      return false;
    };

    const success = initializeGoogleSignIn();
    if (success) return;

    const interval = setInterval(() => {
      const ok = initializeGoogleSignIn();
      if (ok) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center px-4 transition-colors duration-300"
      style={{
        background: 'linear-gradient(180deg, #fff1f5 0%, #f3e8ff 35%, #e0f2fe 70%, #d1fae5 100%)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'linear-gradient(180deg, #1e0a2e 0%, #1a1040 35%, #0d1f3c 70%, #022c22 100%)'
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f9a8d4, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-[400px] h-[300px] rounded-full opacity-0 dark:opacity-25 blur-[90px]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-md w-full -mt-20">
        <div className="bg-white/75 backdrop-blur-md shadow-2xl rounded-2xl border border-white/30 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 mb-4 text-white">
            <h2 className="text-lg font-display font-bold">Farmer & Buyer Login</h2>
            <p className="text-xs opacity-90">Access your FarmTrust portal</p>
          </div>

          <div className="px-6 pb-6">
            <div className="text-center mb-4">
              <img
                src="/main_logo.png"
                alt="FarmTrust logo"
                className="h-10 w-auto object-contain mx-auto mb-2"
              />
              <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100 mb-1">Welcome Back</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sign in to your FarmTrust account</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg mb-4 text-xs">
                <p className="font-semibold">Error: {error}</p>
              </div>
            )}

            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  onChange={onChange}
                  required
                  className="input-field py-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  onChange={onChange}
                  required
                  className="input-field py-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mb-3 text-base">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <div id="googleSignInDiv" className="w-full flex justify-center"></div>
            </div>

            <div className="divider my-2"></div>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-4">
              Don't have an account? <Link to="/register" className="link-primary">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;