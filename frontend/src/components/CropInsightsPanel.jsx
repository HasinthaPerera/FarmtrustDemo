import React, { useState, useMemo } from 'react';
import { 
  ArrowUp, 
  ArrowDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-800 p-3 rounded-lg shadow-xl">
        <p className="text-gray-900 dark:text-slate-300 text-sm mb-2 font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color || entry.stroke || '#10b981' }}>
            {entry.name}: Rs. {typeof entry.value === 'object' ? `${entry.value[0]} - ${entry.value[1]}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CropInsightsPanel = ({ 
  summary, 
  history = [], 
  forecast = [], 
  cropName, 
  cropEmoji 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Format forecast for Area range
  const formattedForecast = forecast.map(f => ({
    ...f,
    date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    range: [f.lower, f.upper]
  }));

  const formattedHistory = history.map(h => ({
    ...h,
    date: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Weekly averages from 30-day history using useMemo
  const weeklyAverages = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Ensure chronological order
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const weeks = [];
    // Chunk into 4 weeks starting from the end
    for (let i = 0; i < 4; i++) {
      const end = sorted.length - i * 7;
      const start = Math.max(0, end - 7);
      if (end <= 0) break;
      
      const chunk = sorted.slice(start, end);
      const avg = chunk.reduce((sum, item) => sum + item.price, 0) / chunk.length;
      
      weeks.unshift({
        week: `Week ${4 - i}`,
        price: Number(avg.toFixed(2))
      });
    }
    return weeks;
  }, [history]);

  // Combine history and forecast for the table filter
  const allPrices = useMemo(() => {
    const hist = (history || []).map(h => ({
      dateObj: new Date(h.date),
      dateStr: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: h.price,
      type: 'Historical'
    }));
    const fore = (forecast || []).map(f => ({
      dateObj: new Date(f.date),
      dateStr: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      price: f.predicted,
      type: 'Forecast'
    }));
    return [...hist, ...fore].sort((a, b) => b.dateObj - a.dateObj); // Newest first
  }, [history, forecast]);

  // Filtered prices based on date range
  const filteredPrices = useMemo(() => {
    if (!startDate && !endDate) return allPrices;
    
    const startStr = startDate || '0000-00-00';
    const endStr = endDate || '9999-12-31';

    return allPrices.filter(item => {
      // Format item date as YYYY-MM-DD local time to avoid timezone bugs
      const year = item.dateObj.getFullYear();
      const month = String(item.dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(item.dateObj.getDate()).padStart(2, '0');
      const itemDateStr = `${year}-${month}-${day}`;

      return itemDateStr >= startStr && itemDateStr <= endStr;
    });
  }, [allPrices, startDate, endDate]);

  // Market status color logic based on requirements
  let statusBadgeColor = 'bg-gray-100 dark:bg-slate-500/20 text-gray-700 dark:text-slate-400';
  if (summary?.market_status === 'LOW') {
    statusBadgeColor = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
  } else if (summary?.market_status === 'HIGH') {
    statusBadgeColor = 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
  } else if (summary?.market_status === 'AVERAGE') {
    statusBadgeColor = 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
  }

  // Position calculation for progress bar
  const priceRange = (summary?.max_30d || 0) - (summary?.min_30d || 0);
  let indicatorPosition = 50;
  if (priceRange > 0 && summary?.tomorrow_price) {
    indicatorPosition = ((summary.tomorrow_price - summary.min_30d) / priceRange) * 100;
    indicatorPosition = Math.max(0, Math.min(100, indicatorPosition));
  }

  const isHigher = summary?.change_month_percent > 0;
  const absChangeMonth = Math.abs(summary?.change_month_percent || 0).toFixed(1);

  if (!summary) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 md:p-6 text-gray-900 dark:text-slate-200">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
          <span className="text-3xl">{cropEmoji}</span>
          {cropName} Insights
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">AI-powered price predictions and market analysis</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Tomorrow's Price</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Rs. {summary.tomorrow_price?.toFixed(2)}</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">vs Last Week</h3>
          <div className={`flex items-center gap-1 text-lg font-bold ${summary.change_week_percent >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
            {summary.change_week_percent >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            {Math.abs(summary.change_week_percent).toFixed(1)}%
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">vs Last Month</h3>
          <div className={`flex items-center gap-1 text-lg font-bold ${summary.change_month_percent >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
            {summary.change_month_percent >= 0 ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
            {Math.abs(summary.change_month_percent).toFixed(1)}%
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-2">Market Status</h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold tracking-wide ${statusBadgeColor}`}>
            {summary.market_status}
          </span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Forecast Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">7-Day Price Forecast</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={formattedForecast} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} tickMargin={10} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="range" 
                  fill="#10b981" 
                  fillOpacity={0.1} 
                  stroke="none" 
                  name="Confidence Interval" 
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
                  activeDot={{ r: 6 }} 
                  name="Predicted"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* History Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">30-Day Price History</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedHistory} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  tickMargin={10} 
                  minTickGap={30}
                />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  strokeWidth={2}
                  name="Historical Price"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Price Range Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">30-Day Range Context</h3>
          
          <div className="relative pt-6 pb-2">
            {/* The Bar */}
            <div className="h-3 w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-600/30 via-emerald-500/50 to-red-500/30 dark:from-emerald-900/50 dark:via-emerald-600/50 dark:to-red-900/50 w-full" />
            </div>
            
            {/* The Marker */}
            <div 
              className="absolute top-4 w-4 h-7 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] border-2 border-white dark:border-slate-900 transform -translate-x-1/2"
              style={{ left: `${indicatorPosition}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded whitespace-nowrap text-emerald-600 dark:text-emerald-400 shadow-sm border border-gray-200 dark:border-slate-700">
                Rs.{summary.tomorrow_price?.toFixed(0)}
              </div>
            </div>
            
            {/* Min/Max Labels */}
            <div className="flex justify-between items-center mt-3 text-sm text-gray-500 dark:text-slate-400 font-medium">
              <div>
                <span className="block text-xs text-gray-400 dark:text-slate-500 mb-1">30D Low</span>
                Rs.{summary.min_30d?.toFixed(0)}
              </div>
              <div className="text-right">
                <span className="block text-xs text-gray-400 dark:text-slate-500 mb-1">30D High</span>
                Rs.{summary.max_30d?.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Weekly Averages (Last 4 Weeks)</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} vertical={false} />
                <XAxis dataKey="week" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} 
                  content={<CustomTooltip />} 
                />
                <Bar dataKey="price" fill="#10b981" radius={[4, 4, 0, 0]} name="Avg Price" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Price Data Table with Date Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-gray-200 dark:border-slate-800 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Price History & Forecast Data</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Filter prices by selecting a date range.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 dark:text-slate-400 mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="mt-5 px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">Price (Rs.)</th>
                <th className="px-4 py-3 font-semibold text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/50">
              {filteredPrices.length > 0 ? (
                filteredPrices.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-slate-200">{item.dateStr}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-slate-200">{item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        item.type === 'Forecast' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                    No prices found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insight Summary Box */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 p-5 rounded-xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg shrink-0 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-2">AI Market Insight</h4>
            <p className="text-gray-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">
              Based on Prophet ML analysis, {cropEmoji} <span className="font-semibold text-gray-900 dark:text-white">{cropName}</span> prices are trending <span className="font-semibold text-gray-900 dark:text-white">{summary.trend}</span>. 
              Tomorrow's predicted price of <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rs.{summary.tomorrow_price?.toFixed(2)}</span> is <span className="font-bold text-gray-900 dark:text-white">{absChangeMonth}% {isHigher ? 'higher' : 'lower'}</span> than last month's average.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropInsightsPanel;
