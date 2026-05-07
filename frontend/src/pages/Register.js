import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', formData);
      localStorage.setItem('token', res.data.token);
      window.location.href = '/farmer';
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="glass-card shadow-2xl border border-white/30 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 mb-4 text-white rounded-t-xl">
            <h2 className="text-xl font-display font-bold">Join FarmTrust</h2>
            <p className="text-sm opacity-90">Create your farmer/buyer account</p>
          </div>
          <div className="text-center mb-8">
            <img
              src="/main_logo.png"
              alt="FarmTrust logo"
              className="h-14 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">Join FarmTrust</h1>
            <p className="text-slate-600 dark:text-slate-400">Create your account to get started</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label dark:text-slate-300">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                onChange={onChange}
                required
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div className="form-group">
              <label className="form-label dark:text-slate-300">Email address</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                onChange={onChange}
                required
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div className="form-group">
              <label className="form-label dark:text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a strong password"
                onChange={onChange}
                required
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
              />
            </div>

            <div className="form-group">
              <label className="form-label dark:text-slate-300">I am a</label>
              <select name="role" onChange={onChange} value={formData.role} className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="buyer">Buyer</option>
                <option value="farmer">Farmer</option>
              </select>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">By signing up, you agree to:</span>
              Our Terms of Service and Privacy Policy. We'll never share your data with third parties.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full mb-4 text-lg">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="divider mb-6"></div>

          <p className="text-center text-slate-600 dark:text-slate-400">
            Already have an account? <Link to="/login" className="link-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;