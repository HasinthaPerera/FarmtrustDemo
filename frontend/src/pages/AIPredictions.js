import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const AIPredictions = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/crops');
        setCrops(res.data || []);
      } catch (err) {
        setError('Could not load crops for forecasting.');
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  const forecastRows = useMemo(() => {
    return crops.map((crop) => {
      const current = Number(crop.price || 0);
      const nameLengthFactor = (crop.name || '').length % 5;
      const qtyFactor = Number(crop.quantity || 0) > 200 ? -0.02 : 0.03;

      const weeklyRate = 0.015 + nameLengthFactor * 0.005 + qtyFactor;
      const monthlyRate = weeklyRate * 4;
      const quarterlyRate = weeklyRate * 12;

      return {
        id: crop.id,
        cropName: crop.name,
        current,
        week1: current * (1 + weeklyRate),
        month1: current * (1 + monthlyRate),
        month3: current * (1 + quarterlyRate),
        trend: weeklyRate >= 0 ? 'Upward' : 'Downward'
      };
    });
  }, [crops]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">Future Crop Prices</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Model-free forecast board for upcoming crop prices. You can plug your trained model later.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 overflow-x-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Forecast Table</h2>
          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">Loading current crop prices...</p>
          ) : forecastRows.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">No crops available yet. Add crops from farmer dashboard to view forecasts.</p>
          ) : (
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300">Crop</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300">Current (INR/kg)</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300">1 Week</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300">1 Month</th>
                  <th className="py-3 pr-4 text-slate-700 dark:text-slate-300">3 Months</th>
                  <th className="py-3 text-slate-700 dark:text-slate-300">Trend</th>
                </tr>
              </thead>
              <tbody>
                {forecastRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">{row.cropName}</td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{row.current.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{row.week1.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{row.month1.toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{row.month3.toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`badge ${row.trend === 'Upward' ? 'badge-success' : 'badge-warning'}`}>
                        {row.trend}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPredictions;
