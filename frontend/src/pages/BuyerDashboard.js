import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { useCart } from '../context/CartContext';
import CropCard from '../components/CropCard';

const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const BuyerDashboard = () => {
  const { addToCart } = useCart();
  const [crops, setCrops] = useState([]);
  const [filter, setFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [variantFilter, setVariantFilter] = useState('All');
  const [error, setError] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [quantity, setQuantity] = useState(1);
  const [orderIntent, setOrderIntent] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Cart Quantity Modal States
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [cartSelectedCrop, setCartSelectedCrop] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [cartError, setCartError] = useState('');

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

  const openCartQuantityWindow = (crop) => {
    setCartSelectedCrop(crop);
    setCartQuantity(1);
    setCartError('');
    setCartModalOpen(true);
  };

  const closeCartQuantityWindow = () => {
    setCartModalOpen(false);
    setCartSelectedCrop(null);
    setCartQuantity(1);
    setCartError('');
  };

  const handleConfirmAddToCart = () => {
    if (!cartSelectedCrop) return;
    const qty = Number(cartQuantity);
    if (isNaN(qty) || qty <= 0) {
      setCartError('Please enter a valid quantity.');
      return;
    }
    if (qty > cartSelectedCrop.quantity) {
      setCartError(`Only ${cartSelectedCrop.quantity} kg available in stock.`);
      return;
    }
    addToCart(cartSelectedCrop, qty);
    closeCartQuantityWindow();
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
        client.get('/crops', getAuthConfig())
      ]).then(([cropsRes]) => {
        setCrops(cropsRes.data);
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

  const uniqueVariants = [...new Set(crops.map(c => c.name))].sort();

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(filter.toLowerCase());
    const matchesDistrict = districtFilter === 'All' || crop.district === districtFilter;
    const matchesVariant = variantFilter === 'All' || crop.name === variantFilter;
    return matchesSearch && matchesDistrict && matchesVariant;
  });

  const totalPreview = selectedCrop ? (Number(selectedCrop.price) * Number(quantity || 0)).toFixed(2) : '0.00';

  return (
    <div className="relative overflow-hidden min-h-screen transition-colors duration-300"
      style={{
        background: 'linear-gradient(180deg, #fff1f5 0%, #f3e8ff 35%, #e0f2fe 70%, #d1fae5 100%)'
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: 'linear-gradient(180deg, #1e0a2e 0%, #1a1040 35%, #0d1f3c 70%, #022c22 100%)'
        }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f9a8d4, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-[400px] h-[300px] rounded-full opacity-0 dark:opacity-25 blur-[90px]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 w-full h-full">
        <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-emerald-300">Buyer Dashboard</h1>
        </div>
        <h2 className="page-title">Available Crops</h2>
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search crops..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 flex-1"
          />
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:w-48"
          >
            <option value="All">All Districts</option>
            {SL_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
            className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white sm:w-48"
          >
            <option value="All">All Vegetables</option>
            {uniqueVariants.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCrops.length > 0 ? (
            filteredCrops.map(crop => (
              <CropCard 
                key={crop.id} 
                crop={crop} 
                role="buyer" 
                onAddToCart={openCartQuantityWindow} 
                onBuyNow={openPaymentWindow} 
              />
            ))
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
                <p className="text-slate-600 dark:text-slate-300">Unit price: Rs. {Number(selectedCrop.price).toFixed(2)} / kg</p>
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
                <p className="text-2xl font-bold text-primary-700">Rs. {totalPreview}</p>
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

      {cartModalOpen && cartSelectedCrop && (
        <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl dark:border dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add to Cart</h3>
              <button type="button" onClick={closeCartQuantityWindow} className="btn-secondary px-3 py-2">
                Close
              </button>
            </div>

            {cartError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
                {cartError}
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Crop: {cartSelectedCrop.name}</p>
                <p className="text-slate-600 dark:text-slate-300">Unit price: Rs. {Number(cartSelectedCrop.price).toFixed(2)} / kg</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Available Stock: {cartSelectedCrop.quantity} kg</p>
              </div>

              <div>
                <label className="form-label dark:text-slate-300">Quantity (kg)</label>
                <input 
                  type="number" 
                  min="1" 
                  max={cartSelectedCrop.quantity} 
                  value={cartQuantity} 
                  onChange={(e) => {
                    setCartQuantity(e.target.value);
                    setCartError('');
                  }} 
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                />
              </div>

              <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                <p className="text-slate-700 dark:text-slate-300">Total Price</p>
                <p className="text-2xl font-bold text-primary-700">Rs. {(Number(cartSelectedCrop.price) * Number(cartQuantity || 0)).toFixed(2)}</p>
              </div>

              <button
                type="button"
                className="btn-primary w-full"
                onClick={handleConfirmAddToCart}
              >
                Confirm Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default BuyerDashboard;