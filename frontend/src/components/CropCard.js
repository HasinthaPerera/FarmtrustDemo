import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const cropImages = {
  'beans': '/images/beans.jpg',
  'brinjal': '/images/brinjal.jpg',
  'cabbage': '/images/cabbage.jpg',
  'carrot': '/images/carrot.webp',
  'green chilli': '/images/green_chilli.webp',
  'lime': '/images/lime.jpg',
  'pumpkin': '/images/pumpkin.jpg',
  'snake gourd': '/images/snake_gourd.webp',
  'tomato': '/images/tomato.jpg',
};

const getCropImage = (name = '') => {
  const key = name.toLowerCase().trim();
  return cropImages[key] || '/images/crops/default.jpg';
};

// Status badge config
const STATUS_CONFIG = {
  pending:  { label: '🕐 Pending Review', cls: 'bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50' },
  approved: { label: '✅ Approved',        cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50' },
  rejected: { label: '❌ Rejected',        cls: 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50' },
};

const CropCard = ({ crop, role = 'buyer', onAddToCart, onBuyNow, onEdit, onDelete }) => {
  const offerPrice = Number(crop.price);
  const discountPct = crop.discount ? Number(crop.discount) : 0;
  const originalPrice = discountPct > 0 ? (offerPrice / (1 - discountPct / 100)).toFixed(2) : null;
  const statusCfg = STATUS_CONFIG[crop.status] || STATUS_CONFIG.pending;

  return (
    <div className="group flex flex-col relative rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow min-h-[400px] w-full">

      {/* ── Top Badges ── */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        {discountPct > 0 ? (
          <span className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {discountPct}% Off
          </span>
        ) : (
          <div />
        )}
        <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/60 dark:border-slate-600 shadow-sm">
          🌱 Fresh Produce
        </span>
      </div>

      {/* ── Image Placement (Top Cover) ── */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-700 select-none">
        <img
          src={getCropImage(crop.name)}
          alt={crop.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/crops/default.jpg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Dimming overlay for non-approved farmer crops */}
        {role === 'farmer' && crop.status !== 'approved' && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
        )}
      </div>

      {/* ── Text & Action Layout (Bottom) ── */}
      <div className="flex flex-col flex-1 p-6 justify-between text-left">
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              Fresh from the farm
            </span>
            {role === 'farmer' && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">
            {crop.name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {role === 'farmer'
              ? `Stock: ${crop.quantity} kg available`
              : `Available: ${crop.quantity} kg`
            }
          </p>

          {crop.description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
              {crop.description}
            </p>
          )}

          {/* Rejected reason hint */}
          {role === 'farmer' && crop.status === 'rejected' && (
            <p className="text-[11px] text-red-500 dark:text-red-400 font-medium pt-1">
              ⚠ Rejected. Edit &amp; resubmit for re-review.
            </p>
          )}
          {role === 'farmer' && crop.status === 'pending' && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
              ⏳ Awaiting admin review before going live.
            </p>
          )}
        </div>

        <div className="space-y-2 mt-4">
          {/* Pricing Row */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-extrabold text-primary-700 dark:text-primary-400">
              Rs. {offerPrice.toFixed(2)}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/kg</span>
            </span>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                Rs. {originalPrice}
              </span>
            )}
          </div>

          {/* Farmer: Edit / Delete buttons */}
          {role === 'farmer' && crop.status !== 'approved' && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onEdit && onEdit(crop)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete && onDelete(crop)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50 text-red-500 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}

          {/* Buyer: Add to Cart / Buy Now */}
          {role === 'buyer' && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400 text-xs font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
                onClick={() => onAddToCart && onAddToCart(crop)}
              >
                Add to Cart
              </button>
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
                onClick={() => onBuyNow && onBuyNow(crop)}
              >
                Buy Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropCard;
