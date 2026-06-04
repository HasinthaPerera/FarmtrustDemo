import React, { useState } from 'react';
import client, { setAuthToken } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    district: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New State for OTP Flow
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Array for 6 boxes
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Step 1: Send OTP
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/send-otp', formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      setLoading(false);
      return;
    }

    try {
      const res = await client.post('/auth/verify-otp', {
        email: formData.email,
        otp: otpString,
      });
      
      // Successful Login
      localStorage.setItem('token', res.data.token);
      setAuthToken(res.data.token);
      
      // Update global auth state
      login({
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
      });

      // Redirect based on role
      const destination = res.data.user.role === 'farmer' ? '/farmer' : '/buyer';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid or expired code. Please try again.');
      setLoading(false);
    }
  };

  // Handle individual OTP box changes
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Handle backspace auto-focus
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        // Clear the previous input as well for better UX
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center px-4 transition-colors duration-300">
      <div className="max-w-md w-full">
        <div className="glass-card shadow-2xl border border-white/30 dark:bg-slate-800 dark:border-slate-700 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6 mb-4 text-white rounded-t-xl">
            <h2 className="text-xl font-display font-bold">{step === 1 ? 'Join FarmTrust' : 'Verify Email'}</h2>
            <p className="text-sm opacity-90">{step === 1 ? 'Create your farmer/buyer account' : 'Enter the code sent to your email'}</p>
          </div>
          <div className="text-center mb-8">
            <img
              src="/main_logo.png"
              alt="FarmTrust logo"
              className="h-14 w-auto object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-slate-100 mb-2">
              {step === 1 ? 'Join FarmTrust' : 'Check your Inbox'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {step === 1 ? 'Create your account to get started' : `We sent a 6-digit code to ${formData.email}. Please enter it below.`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              <p className="font-semibold mb-1">Error</p>
              <p>{error}</p>
            </div>
          )}

          {step === 1 ? (
            // --- STEP 1: Registration Form ---
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
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
                  value={formData.email}
                  onChange={onChange}
                  required
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                />
              </div>

              <div className="form-group">
                <label className="form-label dark:text-slate-300">I am a</label>
                <select
                  name="role"
                  onChange={onChange}
                  value={formData.role}
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  <option value="buyer">Buyer</option>
                  <option value="farmer">Farmer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label dark:text-slate-300">
                  District
                  <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                    — used for location-based alerts
                  </span>
                </label>
                <select
                  name="district"
                  onChange={onChange}
                  value={formData.district}
                  required
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                >
                  <option value="" disabled>Select your district</option>
                  {SL_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label dark:text-slate-300">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={onChange}
                  required
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">By signing up, you agree to:</span>
                Our Terms of Service and Privacy Policy. We'll never share your data with third parties.
              </p>

              <button type="submit" disabled={loading} className="btn-primary w-full mb-4 text-lg">
                {loading ? 'Sending Code...' : 'Create Account'}
              </button>
            </form>
          ) : (
            // --- STEP 2: OTP Verification ---
            <form onSubmit={handleVerifyOtp}>
              <div className="flex justify-center gap-2 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all outline-none"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button type="submit" disabled={loading || otp.join('').length !== 6} className="btn-primary w-full mb-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
              
              <div className="text-center mt-4">
                 <button type="button" onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                    Back to Registration
                 </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="divider mb-6"></div>
              <p className="text-center text-slate-600 dark:text-slate-400">
                Already have an account? <Link to="/login" className="link-primary">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;