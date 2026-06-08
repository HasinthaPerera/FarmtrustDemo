import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import client from '../api/client';
import AddCropModal from '../components/AddCropModal';
import CropCard from '../components/CropCard';

const FarmerDashboard = () => {
  const [crops, setCrops] = useState([]);
  const [isAddCropOpen, setIsAddCropOpen] = useState(false);

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
          <div className="flex flex-row justify-between items-center w-full mb-8">
            <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-white m-0">My Products</h1>
            <button
              onClick={() => setIsAddCropOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-full text-sm font-semibold tracking-wide shadow-sm hover:shadow transition-all duration-300 active:scale-95"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Add Crop</span>
            </button>
          </div>

        <AddCropModal 
          isOpen={isAddCropOpen} 
          onClose={() => setIsAddCropOpen(false)} 
          onCropAdded={fetchCrops} 
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {crops.length > 0 ? (
            crops.map(crop => (
              <CropCard key={crop._id} crop={crop} role="farmer" />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No crops listed yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Start by adding your first crop to the marketplace!</p>
              <button
                onClick={() => setIsAddCropOpen(true)}
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
    </div>
  );
};

export default FarmerDashboard;