import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import { ShoppingBag } from 'lucide-react';

// ── Image-fallback helper ────────────────────────────────────────────────────
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

const getCropEmoji = (name = '') => {
  const key = name.toLowerCase();
  for (const [word, emoji] of Object.entries(CROP_EMOJI_MAP)) {
    if (key.includes(word)) return emoji;
  }
  return '🌿';
};

const BuyerDashboard = () => {
  const { addToCart } = useCart();
  const [crops, setCrops] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [quantity, setQuantity] = useState(1);
  const [orderIntent, setOrderIntent] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleAuthFailure = (msg) => {
    if (msg === 'Token is not valid' || msg === 'No token, authorization denied') {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'x-auth-token': token
      }
    };
  };

  const fetchOrders = async () => {
    try {
      const res = await client.get('/orders/my', getAuthConfig());
      setOrders(res.data);
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (handleAuthFailure(msg)) return;
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await client.get('/crops', getAuthConfig());
        setCrops(res.data);
      } catch (err) {
        console.error('Error fetching crops:', err);
      }
    };

    fetchCrops();
    fetchOrders();
  }, []);

  const openPaymentWindow = (crop) => {
    setSelectedCrop(crop);
    setQuantity(1);
    setPaymentMethod('card');
    setOrderIntent(null);
    setError('');
    setPaymentModalOpen(true);
  };

  const closePaymentWindow = () => {
    setPaymentModalOpen(false);
    setSelectedCrop(null);
    setOrderIntent(null);
    setPaymentLoading(false);
    setError('');
  };

  const createIntent = async () => {
    if (!selectedCrop) return;

    setPaymentLoading(true);
    setError('');
    try {
      const res = await client.post(
        '/orders/create-intent',
        {
          cropId: selectedCrop.id,
          quantity,
          paymentMethod
        },
        getAuthConfig()
      );
      setOrderIntent(res.data);
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (handleAuthFailure(msg)) return;
      setError(msg || 'Failed to create payment intent');
    } finally {
      setPaymentLoading(false);
    }
  };

  const completePayment = async (success) => {
    if (!orderIntent?.orderId) return;

    setPaymentLoading(true);
    setError('');
    try {
      await client.post(
        `/orders/${orderIntent.orderId}/complete`,
        { success },
        getAuthConfig()
      );

      await Promise.all([
        client.get('/crops', getAuthConfig()),
        client.get('/orders/my', getAuthConfig())
      ]).then(([cropsRes, ordersRes]) => {
        setCrops(cropsRes.data);
        setOrders(ordersRes.data);
      });

      closePaymentWindow();
    } catch (err) {
      const msg = err.response?.data?.msg;
      if (handleAuthFailure(msg)) return;
      setError(msg || 'Payment processing failed');
    } finally {
      setPaymentLoading(false);
    }
  };

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(filter.toLowerCase())
  );

  const totalPreview = selectedCrop ? (Number(selectedCrop.price) * Number(quantity || 0)).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">Buyer Dashboard</h1>
          <span className="badge badge-success">Live Market</span>
        </div>
        <h2 className="page-title">Available Crops</h2>
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search crops..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.length > 0 ? (
            filteredCrops.map(crop => {
              const offerPrice = Number(crop.price);
              const originalPrice = (offerPrice * 1.25).toFixed(2);
              const discountPct = 20;
              const emoji = getCropEmoji(crop.name);
              return (
                <div
                  key={crop.id}
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

                    {/* Produce tag – bottom-left */}
                    <span className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/60 dark:border-slate-600 shadow">
                      🌱 Fresh Produce
                    </span>
                  </div>

                  {/* ── Details Area ── */}
                  <div className="flex flex-col flex-1 p-4 gap-3">
                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {crop.name}
                    </h3>

                    {/* Weight / quantity sub-text */}
                    <p className="text-sm text-slate-500 dark:text-slate-400 -mt-1">
                      Available: {crop.quantity} kg
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
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                        onClick={() => addToCart(crop)}
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        type="button"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold hover:from-primary-700 hover:to-primary-800 shadow-md hover:shadow-lg transition-all duration-200"
                        onClick={() => openPaymentWindow(crop)}
                      >
                        ⚡ Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No crops available</h3>
              <p className="text-slate-600 dark:text-slate-400">Farmers haven't listed any crops yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>

      {paymentModalOpen && selectedCrop && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:border dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Payment Window</h3>
              <button type="button" onClick={closePaymentWindow} className="btn-secondary px-3 py-2">
                Close
              </button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Crop: {selectedCrop.name}</p>
                <p className="text-slate-600 dark:text-slate-300">Unit price: ${Number(selectedCrop.price).toFixed(2)} / kg</p>
              </div>

              <div>
                <label className="form-label dark:text-slate-300">Quantity (kg)</label>
                <input type="number" min="1" max={selectedCrop.quantity} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" disabled={paymentLoading || !!orderIntent} />
              </div>

              <div>
                <label className="form-label dark:text-slate-300">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" disabled={paymentLoading || !!orderIntent}>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                <p className="text-slate-700 dark:text-slate-300">Order total</p>
                <p className="text-2xl font-bold text-primary-700">${totalPreview}</p>
              </div>

              {!orderIntent ? (
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={createIntent}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? 'Preparing payment...' : 'Continue to Pay'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700/50">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Order #{orderIntent.orderId} is ready</p>
                    <p className="text-slate-600 dark:text-slate-400">Click an option below to simulate payment result.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full"
                    onClick={() => completePayment(true)}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? 'Processing...' : 'Pay Successfully'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={() => completePayment(false)}
                    disabled={paymentLoading}
                  >
                    Simulate Failed Payment
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BuyerDashboard;