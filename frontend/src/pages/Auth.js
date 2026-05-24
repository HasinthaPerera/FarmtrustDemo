import React, { useState } from 'react';
import client, { setAuthToken } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

// ── Sri Lankan Districts ─────────────────────────────────────────────────────
const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

// ── Role → destination map ───────────────────────────────────────────────────
const ROLE_ROUTES = { farmer: '/farmer', admin: '/admin', buyer: '/buyer' };

// ── Google SVG Icon ──────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M23.64 12.2c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// ── Input Field Component ────────────────────────────────────────────────────
const AuthInput = ({ label, type = 'text', name, placeholder, value, onChange, required, suffix }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 transition-colors duration-300">
      {label}
    </label>
    <div className="relative">
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-800/80 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                   transition-all duration-200 pr-10"
      />
      {suffix && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {suffix}
        </div>
      )}
    </div>
  </div>
);

// ── Auth Select Component ────────────────────────────────────────────────────
const AuthSelect = ({ label, name, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 transition-colors duration-300">
      {label}
    </label>
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-300 dark:bg-slate-800/80 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500
                   transition-all duration-200 appearance-none pr-10"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 dark:text-slate-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  </div>
);

// ── Main Auth Component ──────────────────────────────────────────────────────
const Auth = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ── UI state ──
  const [isLogin, setIsLogin] = useState(true);

  // ── Login state ──
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // ── Register state ──
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'buyer', district: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await client.post('/auth/login', loginData);
      console.log('[Auth/Login] API RESPONSE:', res.data);

      localStorage.setItem('token', res.data.token);

      const rawRole = String(res.data.user?.role || '').toLowerCase() || 'buyer';
      const userData = {
        id: res.data.user?.id ?? null,
        name: res.data.user?.name || loginData.email,
        email: res.data.user?.email || loginData.email,
        role: rawRole,
      };

      console.log('[Auth/Login] CONSTRUCTED USER:', userData);
      login(userData);
      setAuthToken(res.data.token);

      const destination = ROLE_ROUTES[userData.role] ?? '/';
      navigate(destination, { replace: true });
    } catch (err) {
      setLoginError(err.response?.data?.msg || 'Login failed. Please try again.');
      setLoginLoading(false);
    }
  };

  // ── Register handler ─────────────────────────────────────────────────────
  const handleRegister = async e => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    try {
      const res = await client.post('/auth/register', registerData);
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      window.location.href = registerData.role === 'farmer' ? '/farmer' : '/buyer';
    } catch (err) {
      setRegisterError(err.response?.data?.msg || 'Registration failed. Please try again.');
      setRegisterLoading(false);
    }
  };

  // ── Google placeholder ───────────────────────────────────────────────────
  const handleGoogleSignIn = () => {
    alert('Google Sign-In integration coming soon!');
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      {/* ── Main container ── */}
      <div className="relative w-full max-w-5xl h-[680px] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex bg-white dark:bg-slate-900 transition-all duration-300">

        {/* ════════════════════════════════════════════════════════════
            BASE LAYER — Left: Login Form | Right: Register Form
        ════════════════════════════════════════════════════════════ */}

        {/* ── Login Form (LEFT half) ── */}
        <div
          className="absolute inset-y-0 left-0 w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-center px-10 py-10 overflow-y-auto transition-colors duration-300"
          style={{ pointerEvents: isLogin ? 'auto' : 'none' }}
        >
          {/* ── Brand mark ── */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/main_logo.png"
              alt="FarmTrust"
              className="h-10 w-auto object-contain mb-2"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-primary-900 dark:text-emerald-900 font-bold text-lg tracking-tight">FarmTrust</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 transition-colors duration-300">Welcome Back</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">Sign in to continue to FarmTrust</p>
          </div>

          {/* Error */}
          {loginError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {loginError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            <AuthInput
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={loginData.email}
              onChange={e => setLoginData({ ...loginData, email: e.target.value })}
              required
            />
            <AuthInput
              label="Password"
              type={showLoginPwd ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={loginData.password}
              onChange={e => setLoginData({ ...loginData, password: e.target.value })}
              required
              suffix={
                <button
                  type="button"
                  onClick={() => setShowLoginPwd(p => !p)}
                  className="text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  tabIndex={-1}
                >
                  {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700
                         bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600
                         transition-all duration-200"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-500 dark:text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm
                         transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* ── Register Form (RIGHT half) ── */}
        <div
          className="absolute inset-y-0 right-0 w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-center px-10 py-8 overflow-y-auto transition-colors duration-300"
          style={{ pointerEvents: !isLogin ? 'auto' : 'none' }}
        >
          {/* ── Brand mark ── */}
          <div className="flex flex-col items-center mb-5">
            <img
              src="/main_logo.png"
              alt="FarmTrust"
              className="h-10 w-auto object-contain mb-2"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
            <span className="text-primary-900 dark:text-emerald-900 font-bold text-lg tracking-tight">FarmTrust</span>
          </div>

          {/* Header */}
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1 transition-colors duration-300">Create Account</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">Join thousands of farmers and buyers on FarmTrust</p>
          </div>

          {/* Error */}
          {registerError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              {registerError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister}>
            <AuthInput
              label="Full Name"
              name="name"
              placeholder="Kamal Perera"
              value={registerData.name}
              onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
              required
            />
            <AuthInput
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={registerData.email}
              onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
              required
            />
            <AuthInput
              label="Password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={registerData.password}
              onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
              required
            />

            {/* Two-column selects */}
            <div className="grid grid-cols-2 gap-3">
              <AuthSelect
                label="I am a"
                name="role"
                value={registerData.role}
                onChange={e => setRegisterData({ ...registerData, role: e.target.value })}
                options={[
                  { value: 'buyer', label: 'Buyer' },
                  { value: 'farmer', label: 'Farmer' },
                ]}
              />
              <AuthSelect
                label="District"
                name="district"
                value={registerData.district}
                onChange={e => setRegisterData({ ...registerData, district: e.target.value })}
                options={[
                  { value: '', label: 'Select district' },
                  ...SL_DISTRICTS.map(d => ({ value: d, label: d })),
                ]}
              />
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              By creating an account, you agree to our{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">Terms of Service</span> and{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline">Privacy Policy</span>.
            </p>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={registerLoading}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm
                         transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {registerLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>

        {/* ════════════════════════════════════════════════════════════
            TOP LAYER — Sliding Image Panel (z-10)
            isLogin=true  → panel covers the RIGHT (translateX = 100%)
            isLogin=false → panel covers the LEFT  (translateX = 0%)
        ════════════════════════════════════════════════════════════ */}
        {/* isLogin=true  → panel slides RIGHT (translate-x-full) → Login form visible on LEFT
             isLogin=false → panel slides LEFT  (translate-x-0)    → Register form visible on RIGHT */}
        <div
          className={`absolute inset-y-0 left-0 w-1/2 z-10
                      transition-transform duration-500 ease-in-out
                      ${isLogin ? 'translate-x-full' : 'translate-x-0'}`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=80')`
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/95 via-emerald-900/60 to-slate-900/50" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="/main_logo.png"
                alt="FarmTrust"
                className="h-9 w-auto object-contain drop-shadow-lg"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <span className="text-white font-bold text-xl tracking-tight drop-shadow-lg">FarmTrust</span>
            </div>

            {/* Center tagline */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-xs font-medium">Live Marketplace</span>
              </div>
              <h3 className="text-3xl font-bold text-white leading-tight mb-3">
                Connecting Farmers &amp; Buyers
                <span className="block text-emerald-300">Across Sri Lanka</span>
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
                Direct farm-to-table commerce. Cut out the middlemen, get fair prices, build lasting relationships.
              </p>
            </div>

            {/* Trust badges + Toggle pill */}
            <div className="space-y-4">
              {/* Trust badges */}
              <div className="space-y-2">
                {[
                  '✓  Verified Farmers',
                  '✓  Fresh Produce',
                  '✓  Secure Payments',
                ].map(badge => (
                  <div
                    key={badge}
                    className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/10"
                  >
                    <span className="text-emerald-300 text-sm font-semibold">{badge}</span>
                  </div>
                ))}
              </div>

              {/* Toggle pill */}
              <div className="flex justify-center">
                <div
                  id="auth-toggle-pill"
                  className="flex items-center bg-slate-800/80 backdrop-blur-sm rounded-full p-1 border border-slate-700/60 shadow-xl"
                >
                  {/* Sign Up pill: active when isLogin=false → setIsLogin(false) */}
                  <button
                    id="toggle-signup-btn"
                    onClick={() => setIsLogin(false)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300
                      ${!isLogin
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Sign Up
                  </button>
                  {/* Log In pill: active when isLogin=true → setIsLogin(true) */}
                  <button
                    id="toggle-login-btn"
                    onClick={() => setIsLogin(true)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300
                      ${isLogin
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                      }`}
                  >
                    Log In
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;
