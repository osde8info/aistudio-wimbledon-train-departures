
import React, { useState, useEffect, useCallback } from 'react';
import { fetchWimbledonDepartures } from './services/geminiService';
import { Departure, StationData, TransportType } from './types';
import DepartureItem from './components/DepartureItem';

const App: React.FC = () => {
  const [data, setData] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransportType | 'ALL'>('ALL');
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWimbledonDepartures();
      setData(result);
      setLastRefreshed(Date.now());
    } catch (err) {
      setError('Failed to fetch live data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Refresh every 2 minutes
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredDepartures = data?.departures.filter(d => 
    filter === 'ALL' || d.type === filter
  ) || [];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <span className="w-3 h-8 bg-orange-500 rounded-full"></span>
              Wimbledon Live
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              National Rail • District Line • Tramlink
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="text-[10px] text-slate-500 font-mono">
              UPDATED: {data?.lastUpdated || 'Never'}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
          {(['ALL', TransportType.TRAIN, TransportType.TUBE, TransportType.TRAM] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === type 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {type === 'ALL' ? 'ALL PLATFORMS' : type}
            </button>
          ))}
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 bg-slate-900 overflow-y-auto">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Fetching departures...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
              <p className="text-red-400 mb-4">{error}</p>
              <button 
                onClick={loadData}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : filteredDepartures.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <p>No services found matching current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredDepartures.map((departure) => (
              <DepartureItem key={departure.id} departure={departure} />
            ))}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="bg-slate-900 p-6 border-t border-slate-800">
        <div className="text-xs text-slate-500 space-y-3">
          <p className="font-bold text-slate-400 uppercase tracking-widest">Grounding Sources</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {data?.sources.map((source, i) => (
              <li key={i}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors underline decoration-slate-700"
                >
                  {source.title}
                </a>
              </li>
            ))}
            {(!data?.sources || data.sources.length === 0) && (
              <li>National Rail Enquiries, TfL Open Data</li>
            )}
          </ul>
          <p className="pt-2 border-t border-slate-800/50">
            Wimbledon station has 10+ platforms. Platforms 1-4 are usually used by SWR and Thameslink, 5-8 by SWR, 9 by the District Line, and 10 by Tramlink. Platform usage may change due to engineering works.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
