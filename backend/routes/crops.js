const express = require('express');
const auth = require('../middleware/auth');
const { Crop, User } = require('../models');
const { sendNewListingAlert } = require('../utils/emailService');

const router = express.Router();

// Get all crops
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.findAll({
      include: [{
        model: User,
        as: 'farmer',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(crops);
  } catch (err) {
    console.error('Get crops error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add crop (farmer only)
router.post('/', auth, async (req, res) => {
  const { name, quantity, price, description, district } = req.body;
  try {
    const crop = await Crop.create({
      name,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      description,
      district,
      farmerId: req.user.id
    });

    // Fetch the created crop with farmer info (we need farmer name and district)
    const cropWithFarmer = await Crop.findByPk(crop.id, {
      include: [{
        model: User,
        as: 'farmer',
        attributes: ['id', 'name', 'email', 'district']
      }]
    });

    // ── 1. Immediate Response ───────────────────────────────────────────────
    // Return early to ensure the UI feels lightning fast
    res.status(201).json(cropWithFarmer);

    // ── 2. Background Fire-and-Forget Task ──────────────────────────────────
    if (cropWithFarmer && cropWithFarmer.district) {
      const farmerName = cropWithFarmer.farmer ? cropWithFarmer.farmer.name : 'A local farmer';
      const cropDistrict = cropWithFarmer.district;
      
      User.findAll({
        where: {
          role: 'buyer',
          district: cropDistrict
        },
        attributes: ['email', 'name']
      }).then(buyers => {
        if (buyers.length > 0) {
          const productDetails = {
            cropName: cropWithFarmer.name,
            quantity: cropWithFarmer.quantity,
            price: cropWithFarmer.price,
            farmerName: farmerName
          };

          // Map over buyers and send emails concurrently
          Promise.allSettled(
            buyers.map(buyer => 
              sendNewListingAlert(buyer.email, buyer.name, productDetails)
            )
          ).then(results => {
             const successful = results.filter(r => r.status === 'fulfilled').length;
             console.log(`[Alerts] Sent ${successful}/${buyers.length} new listing alerts in ${cropDistrict}`);
          });
        }
      }).catch(err => {
         console.error('[Alerts] Background task failed to fetch buyers:', err);
      });
    }

  } catch (err) {
    console.error('Add crop error:', err);
    // Only send error if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ msg: 'Server error' });
    }
  }
});

// Update crop
router.put('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }

    // Check if user owns this crop
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await crop.update(req.body);

    // Fetch updated crop with farmer info
    const updatedCrop = await Crop.findByPk(crop.id, {
      include: [{
        model: User,
        as: 'farmer',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json(updatedCrop);
  } catch (err) {
    console.error('Update crop error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Delete crop
router.delete('/:id', auth, async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);
    if (!crop) {
      return res.status(404).json({ msg: 'Crop not found' });
    }

    // Check if user owns this crop
    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await crop.destroy();
    res.json({ msg: 'Crop deleted' });
  } catch (err) {
    console.error('Delete crop error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;