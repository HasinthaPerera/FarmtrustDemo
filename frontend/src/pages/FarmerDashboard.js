import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import client from '../api/client';
import AddCropModal from '../components/AddCropModal';
import CropCard from '../components/CropCard';
const FarmerDashboard = () => {
  const [crops, setCrops] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);   // null = add mode
  const [deletingCrop, setDeletingCrop] = useState(null); // crop to confirm-delete
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await client.get('/crops/my', {
        headers: { 'x-auth-token': token }
      });
      setCrops(res.data);
    } catch (err) {
      console.error('Error fetching crops:', err);
    }
  };

  // Open modal in "add" mode
  const handleOpenAdd = () => {
    setEditingCrop(null);
    setIsModalOpen(true);
  };

  // Open modal in "edit" mode
  const handleEdit = (crop) => {
    setEditingCrop(crop);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCrop(null);
  };

  // Confirm-delete flow
  const handleDeleteConfirm = async () => {
    if (!deletingCrop) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      await client.delete(`/crops/${deletingCrop.id}`, {
        headers: { 'x-auth-token': token }
      });
      setDeletingCrop(null);
      fetchCrops();
    } catch (err) {
      console.error('Error deleting crop:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Status summary counts
  const pending  = crops.filter(c => c.status === 'pending').length;
  const approved = crops.filter(c => c.status === 'approved').length;
  const rejected = crops.filter(c => c.status === 'rejected').length;

  return (
    <div className="relative overflow-hidden min-h-screen transition-colors duration-300"
      style={{ background: 'linear-gradient(180deg, #fff1f5 0%, #f3e8ff 35%, #e0f2fe 70%, #d1fae5 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{ background: 'linear-gradient(180deg, #1e0a2e 0%, #1a1040 35%, #0d1f3c 70%, #022c22 100%)' }}
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #f9a8d4, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-25 dark:opacity-15 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #c4b5fd, transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #7dd3fc, transparent 70%)' }} />
      </div>

      <div className="relative z-10 w-full h-full">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex flex-row justify-between items-center w-full mb-6">
            <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-white m-0">My Products</h1>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all duration-300 active:scale-95"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Add Crop</span>
            </button>
          </div>

          {/* Info banner */}
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex-1">
              ℹ️ New crops are reviewed by an admin before appearing in the marketplace. You can edit or remove a crop while it's pending.
            </p>
            <div className="flex items-center gap-4 text-xs font-semibold flex-shrink-0">
              <span className="text-amber-600 dark:text-amber-400">🕐 Pending: {pending}</span>
              <span className="text-emerald-600 dark:text-emerald-400">✅ Approved: {approved}</span>
              {rejected > 0 && <span className="text-red-500 dark:text-red-400">❌ Rejected: {rejected}</span>}
            </div>
          </div>

          {/* Add / Edit Modal */}
          <AddCropModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            onCropAdded={fetchCrops}
            editCrop={editingCrop}
          />

          {/* Crop Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {crops.length > 0 ? (
              crops.map(crop => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  role="farmer"
                  onEdit={handleEdit}
                  onDelete={setDeletingCrop}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🌾</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No crops listed yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">Start by adding your first crop to the marketplace!</p>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all duration-300 active:scale-95 mx-auto"
                >
                  <Plus size={18} className="stroke-[2.5]" />
                  <span>Add Your First Crop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {deletingCrop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delete "{deletingCrop.name}"?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              This will permanently remove this crop listing. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingCrop(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;