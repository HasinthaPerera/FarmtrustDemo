import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FarmerDashboard = () => {
  const [crops, setCrops] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    description: ''
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
      const res = await axios.get('http://localhost:5000/api/crops', config);
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

      await axios.post('http://localhost:5000/api/crops', formData, config);

      // Reset form and hide it
      setFormData({ name: '', quantity: '', price: '', description: '' });
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">Farmer Dashboard</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : 'Add Crop'}
          </button>
        </div>

        {showAddForm && (
          <div className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 mb-8 p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Add New Crop</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="form-label dark:text-slate-300">Crop Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Organic Tomatoes" required className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" />
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

        <div className="flex justify-between items-center mb-8">
          <h2 className="page-title">Your Crops</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary"
          >
            {showAddForm ? 'Cancel' : 'Add Crop'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.length > 0 ? (
            crops.map(crop => (
              <div key={crop._id} className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 hover:shadow-2xl transition-transform transform hover:-translate-y-1">
                <h3 className="text-xl font-bold text-primary mb-2">{crop.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-2"><strong>Quantity:</strong> {crop.quantity} kg</p>
                <p className="text-slate-600 dark:text-slate-300 mb-2"><strong>Price:</strong> ${crop.price}/kg</p>
                {crop.description && <p className="text-slate-600 dark:text-slate-300"><strong>Description:</strong> {crop.description}</p>}
              </div>
            ))
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