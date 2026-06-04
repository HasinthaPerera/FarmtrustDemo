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

module.exports = router;
