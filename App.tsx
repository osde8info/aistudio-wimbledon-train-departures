
import React, { useState, useEffect, useCallback } from 'react';
import { fetchStationDepartures } from './services/geminiService';
import { Departure, StationData, TransportType, Station } from './types';
import DepartureItem from './components/DepartureItem';

const SURREY_STATIONS: Station[] = [
  { name: 'Wimbledon', code: 'WIM' },
  { name: 'Guildford', code: 'GLD' },
  { name: 'Woking', code: 'WOK' },
  { name: 'Epsom', code: 'EPS' },
  { name: 'Redhill', code: 'RDH' },
  { name: 'Staines', code: 'SNN' },
  { name: 'Dorking', code: 'DKG' },
  { name: 'Reigate', code: 'REI' },
  { name: 'Camberley', code: 'CAM' },
  { name: 'Leatherhead', code: 'LHD' },
  { name: 'Weybridge', code: 'WYB' },
  { name: 'Farnham', code: 'FNH' },
];

const App: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<Station>(SURREY_STATIONS[0]);
  const [data, setData] = useState<StationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransportType | 'ALL'>('ALL');

  const loadData = useCallback(async (stationToLoad: Station) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStationDepartures(stationToLoad);
      setData(result);
    } catch (err) {
      setError('Failed to fetch live data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedStation);
    const interval = setInterval(() => loadData(selectedStation), 120000);
    return () => clearInterval(interval);
  }, [loadData, selectedStation]);

  const handleStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const station = SURREY_STATIONS.find(s => s.name === e.target.value);
    if (station) {
      setSelectedStation(station);
    }
  };

  const filteredDepartures = data?.departures.filter(d => 
    filter === 'ALL' || d.type === filter
  ) || [];

  const availableTypes = Array.from(new Set(data?.departures.map(d => d.type) || []));

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-4xl mx-auto shadow-2xl">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="w-3 h-8 bg-orange-500 rounded-full shrink-0"></span>
              <div className="relative group flex-1">
                <select 
                  value={selectedStation.name}
                  onChange={handleStationChange}
                  className="appearance-none bg-transparent text-2xl font-black text-white pr-8 focus:outline-none cursor-pointer w-full"
                >
                  {SURREY_STATIONS.map(s => (
                    <option key={s.name} value={s.name} className="bg-slate-900 text-base font-sans">
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm mt-1 ml-6">
              Live Departure Board • {selectedStation.code}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadData(selectedStation)}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
              UPDATED: {data?.lastUpdated || 'Never'}
            </div>
          </div>
        </div>

        {/* Filters */}
        {availableTypes.length > 1 && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'ALL' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              ALL SERVICES
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  filter === type 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Board */}
      <main className="flex-1 bg-slate-900 overflow-y-auto">
        {loading && !data ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-500">
            <div className="animate-pulse flex flex-col items-center text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Connecting to live feeds for {selectedStation.name}...</p>
              <p className="text-xs mt-2 opacity-60">This may take a few seconds</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl">
              <p className="text-red-400 mb-4 font-medium">{error}</p>
              <button 
                onClick={() => loadData(selectedStation)}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : filteredDepartures.length === 0 ? (
          <div className="p-20 text-center text-slate-500">
            <p className="text-lg">No services currently scheduled from {selectedStation.name}.</p>
            <p className="text-sm mt-2 opacity-60 italic">Try refreshing or checking a different station.</p>
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
          <p className="font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Real-time Grounding Sources
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {data?.sources.map((source, i) => (
              <li key={i}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-orange-400 transition-colors underline decoration-slate-700 truncate max-w-[200px] inline-block"
                >
                  {source.title}
                </a>
              </li>
            ))}
            {(!data?.sources || data.sources.length === 0) && (
              <li>National Rail Enquiries, Live Traffic Data</li>
            )}
          </ul>
          <div className="pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="italic">
              Data is generated using Google Search grounding for real-time accuracy. Platform info is indicative.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">SURREY HUB</span>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">V1.1</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
