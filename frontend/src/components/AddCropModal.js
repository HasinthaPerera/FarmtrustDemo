import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon } from 'lucide-react';
import client from '../api/client';

const AI_CROPS = [
  'Beans', 'Brinjal', 'Cabbage', 'Carrot', 'Green Chilli',
  'Lime', 'Pumpkin', 'Snake gourd', 'Tomato'
];

const SL_DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo',
  'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara',
  'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar',
  'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
];

const CROP_IMAGES = {
  Beans: '/images/crops/beans.jpg',
  Brinjal: '/images/crops/brinjal.jpg',
  Cabbage: '/images/crops/cabbage.jpg',
  Carrot: '/images/crops/carrot.jpg',
  'Green Chilli': '/images/crops/green_chilli.jpg',
  Lime: '/images/crops/lime.jpg',
  Pumpkin: '/images/crops/pumpkin.jpg',
  'Snake gourd': '/images/crops/snake_gourd.jpg',
  Tomato: '/images/crops/tomato.jpg',
};

const AddCropModal = ({ isOpen, onClose, onCropAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    price: '',
    description: '',
    district: '',
    discount: ''
  });
  const [cropName, setCropName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'name') {
      setCropName(e.target.value);
    }
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

      // Reset form and preview
      setFormData({ name: '', quantity: '', price: '', description: '', district: '', discount: '' });
      setCropName('');
      
      alert('Crop added successfully!');
      onCropAdded(); // Refresh crops list
      onClose(); // Close modal
    } catch (err) {
      console.error('Error adding crop:', err);
      alert('Error adding crop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    // Reset state on close
    setFormData({ name: '', quantity: '', price: '', description: '', district: '', discount: '' });
    setCropName('');
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleModalClose}
      />
      
      {/* Modal card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative z-10 border border-slate-100 dark:border-slate-800 transition-all duration-300 transform scale-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          type="button"
          onClick={handleModalClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Add New Crop</h3>
        
        {/* Dynamic Image Preview Section */}
        <div className="mb-6">
          {cropName ? (
            <img 
              src={CROP_IMAGES[cropName]} 
              alt={cropName} 
              className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner"
            />
          ) : (
            <div className="w-full h-48 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 text-sm gap-2">
              <ImageIcon size={28} className="stroke-[1.5]" />
              <span>Please select a crop to see preview</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label dark:text-slate-300">Quantity (kg)</label>
              <input 
                type="number" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleInputChange} 
                placeholder="e.g., 100" 
                required 
                min="1" 
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" 
              />
            </div>
            <div>
              <label className="form-label dark:text-slate-300">Price per Unit ($)</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleInputChange} 
                placeholder="e.g., 2.50" 
                required 
                min="0.01" 
                step="0.01" 
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="form-label dark:text-slate-300">Discount Offer (%)</label>
              <input 
                type="number" 
                name="discount" 
                value={formData.discount} 
                onChange={handleInputChange} 
                placeholder="e.g., 20 (Optional)" 
                min="0" 
                max="99" 
                className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400" 
              />
            </div>
          </div>

          <div>
            <label className="form-label dark:text-slate-300">Description (Optional)</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleInputChange} 
              placeholder="Additional details about your crop" 
              rows="3"
              className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 resize-none py-2" 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleModalClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Adding Crop...' : 'Add Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddCropModal;
