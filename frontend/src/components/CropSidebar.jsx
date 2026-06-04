import React, { useState } from 'react';

const CropSidebar = ({ crops = [], selectedCrop, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCrops = crops.filter(crop =>
    crop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-[220px] h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 overflow-y-auto flex flex-col shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

      {/* Sticky Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 sticky top-0 bg-gray-50 dark:bg-slate-900 z-10">
        <input
          type="text"
          placeholder="Search crops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {/* Crop List */}
      <div className="flex flex-col">
        {filteredCrops.map((crop, index) => {
          const isSelected = selectedCrop === crop.name;

          return (
            <button
              key={`${crop.name}-${index}`}
              onClick={() => onSelect(crop.name)}
              className={`
                w-full flex items-center justify-between h-14 px-4 border-b border-gray-100 dark:border-slate-800/50 transition-colors duration-150 group
                ${isSelected
                  ? 'border-l-4 border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-slate-800'
                  : 'border-l-4 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800/50'
                }
              `}
            >
              {/* Left Side: Crop Name */}
              <span
                className={`truncate text-sm transition-colors ${isSelected ? 'text-emerald-700 dark:text-white font-medium' : 'text-gray-600 dark:text-slate-400 group-hover:text-gray-900 dark:group-hover:text-slate-200'
                  }`}
              >
                {crop.name}
              </span>

              {/* Right Side: Price + Trend */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-gray-900 dark:text-slate-300 tabular-nums">
                  {crop.tomorrowPrice ? crop.tomorrowPrice.toFixed(2) : '--'}
                </span>

                {crop.trend === 'UP' && (
                  <span className="text-sm text-emerald-500 font-bold">↑</span>
                )}
                {crop.trend === 'DOWN' && (
                  <span className="text-sm text-red-500 font-bold">↓</span>
                )}
                {crop.trend !== 'UP' && crop.trend !== 'DOWN' && (
                  <span className="text-sm text-gray-400 dark:text-slate-500 font-bold">-</span>
                )}
              </div>
            </button>
          );
        })}
        {filteredCrops.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-slate-500 text-sm">
            No crops found
          </div>
        )}



      </div>
    </div>
  );
};

export default CropSidebar;
