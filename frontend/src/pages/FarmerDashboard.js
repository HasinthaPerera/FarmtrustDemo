import React, { useEffect, useState } from 'react';
import client from '../api/client';

// ── Image-fallback helper (mirrors BuyerDashboard) ───────────────────────────
const CROP_EMOJI_MAP = {
  banana: '🍌', coconut: '🥥', watermelon: '🍉', mango: '🥭',
  apple: '🍎', orange: '🍊', grape: '🍇', strawberry: '🍓',
  tomato: '🍅', potato: '🥔', carrot: '🥕', corn: '🌽',
  wheat: '🌾', rice: '🍚', onion: '🧅', garlic: '🧄',
  pepper: '🫑', broccoli: '🥦', spinach: '🥬', pumpkin: '🎃',
  lemon: '🍋', pineapple: '🍍', peach: '🍑', pear: '🍐',
  cherry: '🍒', blueberry: '🫐', mushroom: '🍄', cabbage: '🥬',
  cucumber: '🥒', avocado: '🥑', eggplant: '🍆', radish: '🌱',
};

const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const AI_CROPS = [
  'Beans', 'Brinjal', 'Cabbage', 'Carrot', 'Green Chilli',
  'Lime', 'Pumpkin', 'Snake gourd', 'Tomato'
];

const getCropEmoji = (name = '') => {
  const key = name.toLowerCase();
  for (const [word, emoji] of Object.entries(CROP_EMOJI_MAP)) {
    if (key.includes(word)) return emoji;
  }
  return '🌿';
};

const FarmerDashboard = () => {
  const [crops, setCrops] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    description: '',
    district: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      const res = await client.get('/crops', config);
      setCrops(res.data);
    } catch (err) {
      console.error('Error fetching crops:', err);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      };

      await client.post('/crops', formData, config);

      // Reset form and hide it
      setFormData({ name: '', quantity: '', price: '', description: '', district: '' });
      setShowAddForm(false);

      // Refresh crops list
      fetchCrops();

      alert('Crop added successfully!');
    } catch (err) {
      console.error('Error adding crop:', err);
      alert('Error adding crop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="px-4 pt-8 pb-4 flex justify-between items-center">
        <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400 m-0">Farmer Dashboard</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary shadow-sm hover:shadow"
        >
          {showAddForm ? 'Cancel' : 'Add Crop'}
        </button>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {showAddForm && (
          <div className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 mb-8 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Add New Crop</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label dark:text-slate-300">Crop Name</label>
                  <select
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="" disabled>Select a crop...</option>
                    {AI_CROPS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Quantity</label>
                  <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} placeholder="e.g., 100 kg" required min="1" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Price per Unit ($)</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="e.g., 2.50" required min="0.01" step="0.01" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Description (Optional)</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} placeholder="Additional details about your crop" className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">District</label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    required
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="" disabled>Select selling district...</option>
                    {SL_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Adding Crop...' : 'Add Crop'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="page-title mb-8">Your Crops</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.length > 0 ? (
            crops.map(crop => {
              const offerPrice = Number(crop.price);
              const originalPrice = (offerPrice * 1.25).toFixed(2);
              const discountPct = 20;
              const emoji = getCropEmoji(crop.name);
              return (
                <div
                  key={crop._id}
                  className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* ── Image / Emoji Area ── */}
                  <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                    {crop.image ? (
                      <img
                        src={crop.image}
                        alt={crop.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <span className="text-7xl select-none group-hover:scale-110 transition-transform duration-300">
                        {emoji}
                      </span>
                    )}

                    {/* Discount badge – top-left */}
                    <span className="absolute top-3 left-3 bg-violet-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                      {discountPct}% Off
                    </span>

                    {/* Status tag – bottom-left */}
                    <span className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/60 dark:border-slate-600 shadow">
                      ✅ Active Listing
                    </span>
                  </div>

                  {/* ── Details Area ── */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {crop.name}
                    </h3>

                    {/* Quantity sub-text */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
                      Stock: {crop.quantity} kg available
                    </p>

                    {/* Description */}
                    {crop.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {crop.description}
                      </p>
                    )}

                    {/* Pricing row */}
                    <div className="flex items-baseline gap-2 mt-auto">
                      <span className="text-xl font-extrabold text-primary-700 dark:text-primary-400">
                        ${offerPrice.toFixed(2)}
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/kg</span>
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ${originalPrice}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                        Listed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No crops listed yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Start by adding your first crop to the marketplace!</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Your First Crop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;