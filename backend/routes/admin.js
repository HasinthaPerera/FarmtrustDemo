const express = require('express');
const { fn, col, literal } = require('sequelize');
const { User, Crop, Order } = require('../models');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Admin-role guard ──────────────────────────────────────────────────────────
// Sits after authMiddleware; only the hardcoded admin (id = 'admin_1') or any
// future DB user with role = 'admin' may access these routes.
const adminOnly = (req, res, next) => {
  // req.user is set by the JWT middleware as { id }
  if (req.user && req.user.id === 'admin_1') return next();  // hardcoded admin
  return res.status(403).json({ msg: 'Admin access required' });
};

// ── GET /api/admin/metrics ────────────────────────────────────────────────────
// Returns aggregated platform stats for the Admin Dashboard.
router.get('/metrics', authMiddleware, adminOnly, async (req, res) => {
  try {
    // 1. Total registered users
    const totalUsers = await User.count();

    // 2. Active crops — crops that still have stock (quantity > 0)
    const activeCrops = await Crop.count({
      where: { quantity: { [require('sequelize').Op.gt]: 0 } },
    });

    // 3. Total revenue from paid orders (SUM of totalAmount where paymentStatus = 'paid')
    const revenueResult = await Order.findOne({
      attributes: [[fn('SUM', col('totalAmount')), 'totalRevenue']],
      where: { paymentStatus: 'paid' },
      raw: true,
    });
    const rawRevenue = parseFloat(revenueResult?.totalRevenue || 0);

    // Format as currency string, e.g. "$12,890"
    const transactions = rawRevenue.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // 4. Platform health — hardcoded until a real uptime monitor is wired in
    const platformHealth = '99.9%';

    return res.json({
      success: true,
      data: {
        totalUsers:     totalUsers.toLocaleString(),  // e.g. "1,234"
        activeCrops:    activeCrops.toLocaleString(), // e.g. "456"
        transactions,                                 // e.g. "$12,890"
        platformHealth,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/metrics] Error:', err);
    return res.status(500).json({ success: false, msg: 'Server error fetching metrics' });
  }
});


// ────────────────────────────────────────────────────────────────────────────
// ADMIN USERS CRUD ENDPOINTS
// ────────────────────────────────────────────────────────────────────────────

// 1. GET /api/admin/users - Get all active users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']]
    });
    return res.json(users);
  } catch (err) {
    console.error('[GET /api/admin/users] Error:', err);
    return res.status(500).json({ msg: 'Server error fetching active users' });
  }
});

// 2. GET /api/admin/users/trash - Get all inactive (deleted) users
router.get('/users/trash', authMiddleware, adminOnly, async (req, res) => {
  try {
    const trashed = await User.findAll({
      where: { status: 'inactive' },
      order: [['updatedAt', 'DESC']]
    });
    return res.json(trashed);
  } catch (err) {
    console.error('[GET /api/admin/users/trash] Error:', err);
    return res.status(500).json({ msg: 'Server error fetching trashed users' });
  }
});

// 3. POST /api/admin/users - Add a new user (with active status by default)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, password, role, district } = req.body;
  if (!name || !email || !password || !district) {
    return res.status(400).json({ msg: 'Name, email, password and district are required.' });
  }
  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'buyer',
      district,
      status: 'active'
    });

    return res.json(user);
  } catch (err) {
    console.error('[POST /api/admin/users] Error:', err);
    return res.status(500).json({ msg: 'Server error creating user' });
  }
});

// 4. PUT /api/admin/users/:id - Edit user details
router.put('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, role, district, status } = req.body;
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existing = await User.findOne({ where: { email } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ msg: 'This email is already registered to another user.' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.district = district || user.district;
    user.status = status || user.status;

    await user.save();
    return res.json(user);
  } catch (err) {
    console.error('[PUT /api/admin/users/:id] Error:', err);
    return res.status(500).json({ msg: 'Server error updating user' });
  }
});

// 5. DELETE /api/admin/users/:id - Move user to trash (soft delete by marking inactive)
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.status = 'inactive';
    await user.save();
    return res.json({ msg: 'User moved to trash successfully', id: user.id });
  } catch (err) {
    console.error('[DELETE /api/admin/users/:id] Error:', err);
    return res.status(500).json({ msg: 'Server error deactivating user' });
  }
});

// 6. DELETE /api/admin/users/:id/permanent - Permanently delete user
router.delete('/users/:id/permanent', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await user.destroy();
    return res.json({ msg: 'User deleted permanently', id: req.params.id });
  } catch (err) {
    console.error('[DELETE /api/admin/users/:id/permanent] Error:', err);
    return res.status(500).json({ msg: 'Server error permanently deleting user' });
  }
});

module.exports = router;
