import React from 'react';

const CROP_IMAGE_MAP = {
  'beans': '/images/crops/beans.jpg',
  'brinjal': '/images/crops/brinjal.jpg',
  'cabbage': '/images/crops/cabbage.jpg',
  'carrot': '/images/crops/carrot.jpg',
  'green chilli': '/images/crops/green_chilli.jpg',
  'lime': '/images/crops/lime.jpg',
  'pumpkin': '/images/crops/pumpkin.jpg',
  'snake gourd': '/images/crops/snake_gourd.jpg',
  'tomato': '/images/crops/tomato.jpg',
};

const getCropImage = (name = '') => {
  const key = name.toLowerCase().trim();
  return CROP_IMAGE_MAP[key] || '/images/crops/default.jpg';
};

const CropCard = ({ crop, role = 'buyer', onAddToCart, onBuyNow }) => {
  const offerPrice = Number(crop.price);
  const discountPct = crop.discount ? Number(crop.discount) : 0;
  const originalPrice = discountPct > 0 ? (offerPrice / (1 - discountPct / 100)).toFixed(2) : null;

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
        {role === 'farmer' ? (
          <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/60 dark:border-slate-600 shadow-sm">
            ✅ Active Listing
          </span>
        ) : (
          <span className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-700 dark:text-slate-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-white/60 dark:border-slate-600 shadow-sm">
            🌱 Fresh Produce
          </span>
        )}
      </div>

      {/* ── Image Placement (Top Cover) ── */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-700 select-none">
        <img
          src={crop.image || getCropImage(crop.name)}
          alt={crop.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/crops/default.jpg';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* ── Text & Action Layout (Bottom) ── */}
      <div className="flex flex-col flex-1 p-6 justify-between text-left">
        <div className="space-y-1">
          {/* Subtle tagline */}
          <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Fresh from the farm
          </span>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 leading-tight">
            {crop.name}
          </h3>

          {/* Stock / Quantity sub-text */}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {role === 'farmer' 
              ? `Stock: ${crop.quantity} kg available` 
              : `Available: ${crop.quantity} kg`
            }
          </p>

          {/* Description (Optional) */}
          {crop.description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
              {crop.description}
            </p>
          )}
        </div>

        <div className="space-y-2 mt-4">
          {/* Pricing & Status Row */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-lg font-extrabold text-primary-700 dark:text-primary-400">
              ${offerPrice.toFixed(2)}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/kg</span>
            </span>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through">
                ${originalPrice}
              </span>
            )}
            
            {role === 'farmer' && (
              <span className="ml-auto text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                Listed
              </span>
            )}
          </div>

          {/* Action Buttons for Buyer */}
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
