const express  = require('express');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');
const { User }  = require('../models');
const { OAuth2Client } = require('google-auth-library');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory store for pending OTP registrations
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes code validity

// Helper to generate a random 6-digit numeric OTP code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Note: Nodemailer logic and templates are now centralized in utils/emailService.js

// ────────────────────────────────────────────────────────────────────────────
// STEP 1 ── POST /api/auth/send-otp
// Accept registration details, check for duplicates, generate + email an OTP.
// ────────────────────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { name, email, password, role, district } = req.body;

  // Basic field validation
  if (!name || !email || !password || !district) {
    return res.status(400).json({ msg: 'Name, email, password and district are required.' });
  }

  try {
    // Check for existing verified account
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    // Generate OTP and store pending registration (keyed by lowercase email)
    const otp       = generateOTP();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpStore.set(email.toLowerCase(), {
      otp,
      name,
      email,
      password,   // plain-text — will be hashed only after OTP verification
      role:       role || 'buyer',
      district,
      expiresAt,
    });

    // Send email
    await sendOTPEmail(email, name, otp);

    console.log(`[OTP] Sent to ${email} | OTP: ${otp} | Expires: ${new Date(expiresAt).toISOString()}`);

    return res.status(200).json({
      msg: 'Verification code sent! Please check your inbox (and spam folder).',
    });

  } catch (err) {
    console.error('[send-otp] Error:', err);
    return res.status(500).json({ msg: 'Failed to send verification email. Please try again.' });
  }
});

// ────────────────────────────────────────────────────────────────────────────
// STEP 2 ── POST /api/auth/verify-otp
// Validate OTP → hash password → create User → issue JWT.
// ────────────────────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ msg: 'Email and OTP are required.' });
  }

  const key     = email.toLowerCase();
  const pending = otpStore.get(key);

  // OTP not found (never sent, or already consumed)
  if (!pending) {
    return res.status(400).json({ msg: 'No pending verification found for this email. Please request a new code.' });
  }

  // TTL check
  if (Date.now() > pending.expiresAt) {
    otpStore.delete(key);
    return res.status(400).json({ msg: 'Verification code has expired. Please request a new one.' });
  }

  // OTP mismatch
  if (otp.toString().trim() !== pending.otp) {
    return res.status(400).json({ msg: 'Invalid verification code. Please try again.' });
  }

  // ── OTP is valid — create the user ──────────────────────────────────────
  try {
    // Double-check the email wasn't registered while OTP was pending
    const existingUser = await User.findOne({ where: { email: pending.email } });
    if (existingUser) {
      otpStore.delete(key);
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    // Pass the plain-text password to create(); the User model's 
    // beforeCreate hook will automatically hash it before saving to the DB.
    const user = await User.create({
      name:     pending.name,
      email:    pending.email,
      password: pending.password,
      role:     pending.role,
      district: pending.district,
    });

    // Clear OTP store immediately after successful account creation
    otpStore.delete(key);

    // Issue JWT (same structure as /login)
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        return res.status(201).json({
          msg: 'Account verified and created successfully!',
          token,
          user: {
            id:       user.id,
            name:     user.name,
            email:    user.email,
            role:     user.role,
            district: user.district,
          },
        });
      }
    );

  } catch (err) {
    console.error('[verify-otp] Error:', err);
    return res.status(500).json({ msg: 'Server error during account creation.' });
  }
});

// ── POST /api/auth/register (legacy / backward-compatible) ───────────────────
// Kept intact so existing clients are not broken.
router.post('/register', async (req, res) => {
  const { name, email, password, role, district } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,   // hashed by model's beforeCreate hook
      role: role || 'buyer',
      district,
    });

    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // ── Master Admin credential check (intercept BEFORE any DB query) ────────
    // Admins cannot self-register; this is the sole entry point for admin auth.
    const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@farmtrust.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminPayload = { user: { id: 'admin_1' } };
      return jwt.sign(
        adminPayload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' },
        (err, token) => {
          if (err) {
            console.error('JWT sign error (admin):', err);
            return res.status(500).json({ msg: 'Server error' });
          }
          return res.json({
            token,
            user: {
              id:    'admin_1',
              name:  'System Admin',
              email: ADMIN_EMAIL,
              role:  'admin',
            },
          });
        }
      );
    }

    // ── Standard DB-backed login (Farmer / Buyer) ─────────────────────────────
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await user.validatePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        // Return the token AND the user profile so the frontend can
        // perform role-based routing without a second API call.
        res.json({
          token,
          user: {
            id:    user.id,
            name:  user.name,
            email: user.email,
            role:  user.role,   // ENUM: 'farmer' | 'buyer' | 'admin'
          },
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ── POST /api/auth/google ──────────────────────────────────────────────────
// Receive Google ID Token -> verify with Google -> find or create User -> return JWT
router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ msg: 'Google token is required' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ msg: 'Email not provided by Google account' });
    }

    // Find user by googleId, or by email to link them
    let user = await User.findOne({ where: { googleId } });
    if (!user) {
      user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (user) {
        // Link Google ID to existing user if they have the same email
        user.googleId = googleId;
        await user.save();
        console.log(`[Google Auth] Linked existing user: ${email}`);
      } else {
        // Create a new user with buyer role by default
        user = await User.create({
          name: name || email.split('@')[0],
          email: email.toLowerCase(),
          googleId,
          role: 'buyer', // Default role
          // district and password will be null
        });
        console.log(`[Google Auth] Created new user: ${email}`);
      }
    }

    // Issue JWT token (same as email/password login)
    const jwtPayload = { user: { id: user.id } };
    jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' },
      (err, jwtToken) => {
        if (err) throw err;
        res.json({
          token: jwtToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ msg: 'Google authentication failed' });
  }
});

module.exports = router;