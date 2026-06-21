import React, { useState, useEffect } from 'react';
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
  Beans: '/images/beans.jpg',
  Brinjal: '/images/brinjal.jpg',
  Cabbage: '/images/cabbage.jpg',
  Carrot: '/images/carrot.webp',
  'Green Chilli': '/images/green_chilli.webp',
  Lime: '/images/lime.jpg',
  Pumpkin: '/images/pumpkin.jpg',
  'Snake gourd': '/images/snake_gourd.webp',
  Tomato: '/images/tomato.jpg',
};

const EMPTY_FORM = { name: '', quantity: '', price: '', description: '', district: '', discount: '' };

/**
 * AddCropModal
 *
 * Props:
 *   isOpen      – boolean
 *   onClose     – () => void
 *   onCropAdded – () => void  (called after add or edit to refresh list)
 *   editCrop    – crop object | null  (when set, the modal operates in "edit" mode)
 */
const AddCropModal = ({ isOpen, onClose, onCropAdded, editCrop = null }) => {
  const isEditMode = Boolean(editCrop);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [cropName, setCropName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (isEditMode && editCrop) {
      setFormData({
        name: editCrop.name || '',
        quantity: editCrop.quantity || '',
        price: editCrop.price || '',
        description: editCrop.description || '',
        district: editCrop.district || '',
        discount: editCrop.discount || '',
      });
      setCropName(editCrop.name || '');
    } else {
      setFormData(EMPTY_FORM);
      setCropName('');
    }
  }, [editCrop, isEditMode]);

  if (!isOpen && !showSuccessToast) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'name') setCropName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token, 'Content-Type': 'application/json' } };

      if (isEditMode) {
        // Edit: PUT — resets status to pending for re-review
        await client.put(`/crops/${editCrop.id}`, formData, config);
      } else {
        // Add: POST — new crop starts as pending
        await client.post('/crops', formData, config);
      }

      // Reset
      setFormData(EMPTY_FORM);
      setCropName('');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      onCropAdded();
      onClose();
    } catch (err) {
      console.error('Error saving crop:', err);
      alert('Error saving crop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setFormData(EMPTY_FORM);
    setCropName('');
    onClose();
  };

  return createPortal(
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
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

            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {isEditMode ? '✏️ Edit Crop' : 'Add New Crop'}
            </h3>

            {isEditMode && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-2">
                ⚠ Saving changes will reset this listing to <strong>Pending Review</strong>. The admin will need to re-approve it.
              </p>
            )}

            {/* Image Preview */}
            <div className="mb-6">
              {cropName && CROP_IMAGES[cropName] ? (
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
                    type="number" name="quantity" value={formData.quantity}
                    onChange={handleInputChange} placeholder="e.g., 100"
                    required min="1"
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                  />
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Price per Unit (Rs.)</label>
                  <input
                    type="number" name="price" value={formData.price}
                    onChange={handleInputChange} placeholder="e.g., 150"
                    required min="0.01" step="0.01"
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label dark:text-slate-300">District</label>
                  <select
                    name="district" value={formData.district}
                    onChange={handleInputChange} required
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  >
                    <option value="" disabled>Select district...</option>
                    {SL_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label dark:text-slate-300">Discount Offer (%)</label>
                  <input
                    type="number" name="discount" value={formData.discount}
                    onChange={handleInputChange} placeholder="e.g., 20 (Optional)"
                    min="0" max="99"
                    className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="form-label dark:text-slate-300">Description (Optional)</label>
                <textarea
                  name="description" value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional details about your crop"
                  rows="3"
                  className="input-field dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 resize-none py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={handleModalClose} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading
                    ? (isEditMode ? 'Saving...' : 'Adding...')
                    : (isEditMode ? 'Save & Resubmit' : 'Add Crop')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div
        className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-lg shadow-xl border border-slate-700 transition-all duration-300 transform ${
          showSuccessToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-semibold text-white">
          {isEditMode ? 'Crop updated! Pending re-review.' : 'Crop submitted for review!'}
        </span>
      </div>
    </>,
    document.body
  );
};

export default AddCropModal;
