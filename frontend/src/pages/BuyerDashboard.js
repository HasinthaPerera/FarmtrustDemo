import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BuyerDashboard = () => {
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
      const res = await axios.get('http://localhost:5000/api/orders/my', getAuthConfig());
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
        const res = await axios.get('http://localhost:5000/api/crops', getAuthConfig());
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
      const res = await axios.post(
        'http://localhost:5000/api/orders/create-intent',
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
      await axios.post(
        `http://localhost:5000/api/orders/${orderIntent.orderId}/complete`,
        { success },
        getAuthConfig()
      );

      await Promise.all([
        axios.get('http://localhost:5000/api/crops', getAuthConfig()),
        axios.get('http://localhost:5000/api/orders/my', getAuthConfig())
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.length > 0 ? (
            filteredCrops.map(crop => (
              <div key={crop.id} className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 hover:shadow-2xl hover:scale-[1.02] transition-transform">
                <h3 className="text-xl font-bold text-primary mb-2">{crop.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2"><strong>Available:</strong> {crop.quantity} kg</p>
                <p className="text-lg font-bold text-accent mb-4">${crop.price}/kg</p>
                {crop.description && <p className="text-slate-600 dark:text-slate-300 mb-4">{crop.description}</p>}
                <button
                  type="button"
                  className="btn-primary w-full"
                  onClick={() => openPaymentWindow(crop)}
                >
                  Buy Now
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No crops available</h3>
              <p className="text-slate-600 dark:text-slate-400">Farmers haven't listed any crops yet. Check back soon!</p>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="page-title">My Recent Orders</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.length > 0 ? (
              orders.slice(0, 8).map(order => (
                <div key={order.id} className="card dark:bg-slate-800 dark:border dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{order.crop?.name || 'Crop'}</h3>
                    <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">Qty: {order.quantity} kg</p>
                  <p className="text-slate-600 dark:text-slate-300">Total: ${Number(order.totalAmount).toFixed(2)}</p>
                  <p className="text-slate-600 dark:text-slate-300">Method: {order.paymentMethod}</p>
                  {order.paymentReference && (
                    <p className="text-slate-600 dark:text-slate-300">Ref: {order.paymentReference}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full card text-center text-slate-600">
                No orders yet. Buy a crop to create your first order.
              </div>
            )}
          </div>
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