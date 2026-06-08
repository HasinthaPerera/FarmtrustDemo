import React, { useState, useEffect } from 'react';
import CropSidebar from '../components/CropSidebar';
import CropInsightsPanel from '../components/CropInsightsPanel';

const EMOJI_MAP = {
  'Beans': '🫘',
  'Brinjal': '🍆',
  'Cabbage': '🥬',
  'Carrot': '🥕',
  'Green Chilli': '🌶️',
  'Lime': '🍋',
  'Pumpkin': '🎃',
  'Snake gourd': '🐍',
  'Tomato': '🍅'
};

const getEmoji = (name) => EMOJI_MAP[name] || '🌱';

const AI_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';

const AIPredictions = () => {
  const [sidebarCrops, setSidebarCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [panelData, setPanelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialization: Fetch all crops and their summaries for the sidebar
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Fetch crops list
        const cropsRes = await fetch(`${AI_URL}/crops`);
        if (!cropsRes.ok) throw new Error('Failed to fetch crops list');
        const cropNames = await cropsRes.json();

        if (!cropNames || cropNames.length === 0) {
          throw new Error('No crops found');
        }

        // 2. Fetch summary for every crop to build sidebar data
        // Use allSettled so a single 404 doesn't crash the whole page
        const summaryResults = await Promise.allSettled(
          cropNames.map(crop =>
            fetch(`${AI_URL}/summary/${encodeURIComponent(crop)}`).then(res => {
              if (!res.ok) throw new Error(`No summary for ${crop}`);
              return res.json();
            })
          )
        );

        // Keep only successful responses
        const summaries = summaryResults
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        if (summaries.length === 0) {
          throw new Error('No crop summaries could be loaded');
        }

        // 3. Map into sidebarCrops shape
        const mappedCrops = summaries.map(summary => ({
          name: summary.product,
          tomorrowPrice: summary.tomorrow_price,
          trend: summary.trend
        }));

        setSidebarCrops(mappedCrops);
        
        // 4. Set initial selected crop
        setSelectedCrop(mappedCrops[0].name);
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Unable to load predictions. Is the AI service running on port 8000?');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Panel Hydration: Fetch detail data when selectedCrop changes
  useEffect(() => {
    if (!selectedCrop) return;

    const fetchPanelData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const cropEncoded = encodeURIComponent(selectedCrop);
        
        const [summaryRes, historyRes, forecastRes] = await Promise.all([
          fetch(`${AI_URL}/summary/${cropEncoded}`),
          fetch(`${AI_URL}/history/${cropEncoded}`),
          fetch(`${AI_URL}/forecast/${cropEncoded}`)
        ]);

        if (!summaryRes.ok || !historyRes.ok || !forecastRes.ok) {
          throw new Error('Failed to fetch panel data');
        }

        const [summaryData, historyData, forecastData] = await Promise.all([
          summaryRes.json(),
          historyRes.json(),
          forecastRes.json()
        ]);

        setPanelData({
          summary: summaryData,
          history: historyData.history,
          forecast: forecastData.forecast
        });
      } catch (err) {
        console.error('Panel data error:', err);
        setError('Unable to load predictions. Is the AI service running on port 8000?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPanelData();
  }, [selectedCrop]);

  return (
    <div className="relative overflow-hidden h-screen flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white font-sans transition-colors duration-300"
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
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
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

      <div className="relative z-10 flex flex-col w-full h-full">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Future Crop Prices
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm md:text-base">
          AI-powered predictions by Prophet
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-row overflow-hidden flex-1 relative">
        {/* Left: Sidebar */}
        <CropSidebar 
          crops={sidebarCrops} 
          selectedCrop={selectedCrop} 
          onSelect={setSelectedCrop} 
        />

        {/* Right: Panel / Loading / Error */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-slate-900 relative">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="text-red-500 bg-red-50 dark:bg-red-500/10 p-6 rounded-xl border border-red-200 dark:border-red-500/20 max-w-lg">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Connection Error</h3>
                <p className="text-red-700 dark:text-slate-300">{error}</p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 dark:text-slate-400 font-medium">
                {selectedCrop ? `Analyzing ${selectedCrop} market data...` : 'Loading AI Market Intelligence...'}
              </p>
            </div>
          ) : panelData && selectedCrop ? (
            <CropInsightsPanel 
              summary={panelData.summary}
              history={panelData.history}
              forecast={panelData.forecast}
              cropName={selectedCrop}
              cropEmoji={getEmoji(selectedCrop)}
            />
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
};

export default AIPredictions;
