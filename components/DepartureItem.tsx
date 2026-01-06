
import React from 'react';
import { Departure, TransportType } from '../types';

interface Props {
  departure: Departure;
}

const DepartureItem: React.FC<Props> = ({ departure }) => {
  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('on time')) return 'text-green-400';
    if (s.includes('delayed')) return 'text-yellow-400';
    if (s.includes('cancel')) return 'text-red-400';
    return 'text-blue-400';
  };

  const getTypeIcon = (type: TransportType) => {
    switch (type) {
      case TransportType.TUBE:
        return (
          <div className="w-6 h-6 rounded-full border-2 border-red-600 flex items-center justify-center text-[10px] font-bold text-red-600 bg-white">
            θ
          </div>
        );
      case TransportType.TRAM:
        return (
          <div className="w-6 h-6 rounded-md bg-green-600 flex items-center justify-center text-[10px] font-bold text-white">
            T
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-md bg-blue-700 flex items-center justify-center text-[10px] font-bold text-white">
            NR
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-16 font-medium matrix-text text-xl text-orange-400">
          {departure.time}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getTypeIcon(departure.type)}
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-white transition-colors">
              {departure.destination}
            </h3>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mt-1 font-medium">
            {departure.operator} • Platform {departure.platform || 'TBC'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <div className={`text-sm font-bold matrix-text uppercase ${getStatusColor(departure.status)}`}>
          {departure.status}
        </div>
        {departure.platform && (
          <div className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded font-bold">
            PLAT {departure.platform}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartureItem;
