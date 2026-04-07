const express = require('express');
const auth = require('../middleware/auth');
const { Crop, Order, User } = require('../models');

const router = express.Router();

function generatePaymentReference(orderId) {
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `FTPAY-${orderId}-${random}`;
}

// Create order/payment intent (buyer)
router.post('/create-intent', auth, async (req, res) => {
  try {
    const { cropId, quantity, paymentMethod } = req.body;
    const parsedQuantity = parseInt(quantity, 10);

    if (!cropId || !parsedQuantity || parsedQuantity <= 0) {
      return res.status(400).json({ msg: 'Valid cropId and quantity are required' });
    }

    const crop = await Crop.findByPk(cropId);
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }

    if (crop.quantity < parsedQuantity) {
      return res.status(400).json({ msg: 'Requested quantity exceeds available stock' });
    }

    const unitPrice = parseFloat(crop.price);
    const totalAmount = unitPrice * parsedQuantity;

    const order = await Order.create({
      buyerId: req.user.id,
      cropId: crop.id,
      quantity: parsedQuantity,
      unitPrice,
      totalAmount,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'pending'
    });

    res.status(201).json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      crop: {
        id: crop.id,
        name: crop.name
      }
    });
  } catch (err) {
    console.error('Create intent error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Complete payment (mock success/failure)
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const { success } = req.body;
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: Crop, as: 'crop' }]
    });

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.buyerId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({ msg: 'Order already paid', order });
    }

    if (success) {
      if (order.crop.quantity < order.quantity) {
        return res.status(400).json({ msg: 'Insufficient stock at payment confirmation' });
      }

      order.paymentStatus = 'paid';
      order.paymentReference = generatePaymentReference(order.id);
      await order.save();

      await order.crop.update({ quantity: order.crop.quantity - order.quantity });

      return res.json({ msg: 'Payment successful', order });
    }

    order.paymentStatus = 'failed';
    await order.save();
    return res.status(400).json({ msg: 'Payment failed', order });
  } catch (err) {
    console.error('Complete payment error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get logged-in buyer orders
router.get('/my', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyerId: req.user.id },
      include: [
        {
          model: Crop,
          as: 'crop',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(orders);
  } catch (err) {
    console.error('Get buyer orders error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;