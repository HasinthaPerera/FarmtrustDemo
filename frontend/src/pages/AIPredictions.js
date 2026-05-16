import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

// ─── Base URL for all prediction-related endpoints ────────────────────────────
const PREDICT_BASE = 'http://localhost:5000/predict';

// ─── Skeleton loader for the prediction result card ──────────────────────────
const PredictionSkeleton = () => (
  <div className="animate-pulse space-y-4 mt-4">
    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
  </div>
);

// ─── Skeleton loader for the crop button row ──────────────────────────────────
const CropListSkeleton = () => (
  <div className="flex flex-wrap gap-2 mb-6 animate-pulse">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full"
        style={{ width: `${60 + i * 15}px` }}
      />
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AIPredictions = () => {
  // ── Existing: Crop Forecast Table State ───────────────────────────────────
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Dynamic crop list from backend ────────────────────────────────────────
  const [cropList, setCropList] = useState([]);
  const [cropListLoading, setCropListLoading] = useState(true);
  const [cropListError, setCropListError] = useState(null);

  // ── AI Prediction panel state ─────────────────────────────────────────────
  const [selectedCrop, setSelectedCrop] = useState(null); // null until crop list loads
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [predError, setPredError] = useState(null);

  // ── 1. Fetch crop list from backend once on mount ─────────────────────────
  useEffect(() => {
    const fetchCropList = async () => {
      setCropListLoading(true);
      setCropListError(null);
      try {
        // GET /predict/crops → Express proxy → FastAPI /crops
        const res = await axios.get(`${PREDICT_BASE}/crops`);
        const list = res.data;
        setCropList(list);
        // Auto-select first crop once the list arrives
        if (list.length > 0) setSelectedCrop(list[0]);
      } catch (err) {
        setCropListError('Could not load crop list from the AI service.');
      } finally {
        setCropListLoading(false);
      }
    };
    fetchCropList();
  }, []); // runs once

  // ── 2. Fetch prediction whenever selectedCrop changes ────────────────────
  useEffect(() => {
    if (!selectedCrop) return; // wait until crop list is ready

    const fetchPrediction = async () => {
      setIsLoading(true);
      setPredError(null);
      setPrediction(null);
      try {
        // encodeURIComponent handles spaces & brackets, e.g. "Big Onion (Imp)"
        const res = await axios.get(
          `${PREDICT_BASE}/${encodeURIComponent(selectedCrop)}`
        );
        setPrediction(res.data); // { product, predicted_price }
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          'Unable to fetch prediction. Ensure the AI service is running.';
        setPredError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [selectedCrop]); // re-runs on every crop selection

  // ── 3. Existing: Fetch crop list for the Forecast Table ──────────────────
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

  // ── Existing: Forecast row computation ───────────────────────────────────
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
        trend: weeklyRate >= 0 ? 'Upward' : 'Downward',
      };
    });
  }, [crops]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Page Header (unchanged) ──────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-primary-900 dark:text-primary-400">
            Future Crop Prices
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Model-free forecast board for upcoming crop prices. You can plug your trained model later.
          </p>
        </div>

        {/* ── Global error (existing crops fetch) ──────────────────────── */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            AI Price Prediction Panel
        ════════════════════════════════════════════════════════════════ */}
        <div className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            🤖 FarmTrust-AI Price Prediction
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Powered by Prophet · Select a crop to get the next predicted price.
          </p>

          {/* ── Crop Selector: dynamic from backend ────────────────────── */}
          {cropListLoading && <CropListSkeleton />}

          {cropListError && (
            <p className="text-red-500 dark:text-red-400 text-sm mb-4">
              ⚠ {cropListError}
            </p>
          )}

          {!cropListLoading && !cropListError && cropList.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mb-6"
              role="group"
              aria-label="Select crop"
            >
              {cropList.map((crop) => (
                <button
                  key={crop}
                  id={`crop-btn-${crop.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200
                    ${selectedCrop === crop
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          )}

          {/* ── Prediction Output: loading / error / success ──────────── */}
          {isLoading && <PredictionSkeleton />}

          {!isLoading && predError && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-2">
              ⚠ {predError}
            </p>
          )}

          {!isLoading && !predError && prediction && (
            <div className="mt-2 flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Price */}
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  Predicted Next Price
                </p>
                <p className="text-4xl font-display font-bold text-primary-700 dark:text-primary-400 leading-none">
                  Rs. {Number(prediction.predicted_price).toFixed(2)}
                  <span className="text-base font-normal text-slate-500 dark:text-slate-400 ml-1">
                    / kg
                  </span>
                </p>
              </div>

              {/* Product badge */}
              <div className="sm:text-right">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300 text-sm font-semibold">
                  {prediction.product}
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Prophet ML Model · FarmTrust AI
                </p>
              </div>
            </div>
          )}
        </div>
        {/* ════ END AI Prediction Panel ════ */}

        {/* ── Existing: Forecast Table Card (unchanged) ────────────────── */}
        <div className="glass-card dark:bg-slate-800 dark:border dark:border-slate-700 overflow-x-auto">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Forecast Table
          </h2>
          {loading ? (
            <p className="text-slate-600 dark:text-slate-400">
              Loading current crop prices...
            </p>
          ) : forecastRows.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              No crops available yet. Add crops from farmer dashboard to view forecasts.
            </p>
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
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      {row.cropName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {row.current.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {row.week1.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {row.month1.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">
                      {row.month3.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`badge ${row.trend === 'Upward' ? 'badge-success' : 'badge-warning'
                          }`}
                      >
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
