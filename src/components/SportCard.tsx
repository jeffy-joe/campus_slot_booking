import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { SportActivity } from '../types';
import { SportIconRenderer } from './SportIcons';


interface SportCardProps {
  activity: SportActivity;
  onBookNow: (activity: SportActivity) => void;
}

export const SportCard: React.FC<SportCardProps> = ({ activity, onBookNow }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 group">
      <div className="flex items-center gap-4 min-w-0">
        {/* Sport Icon container */}
        <div className="w-14 h-14 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-105 transition-transform">
          <SportIconRenderer iconName={activity.iconName} size={32} className="text-blue-600" />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900 text-base mb-1 tracking-tight">
            {activity.name}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm line-clamp-2">
            {activity.description}
          </p>
        </div>
      </div>

      {/* Book Now Action Button */}
      <button
        onClick={() => onBookNow(activity)}
        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-xs shadow-blue-500/20 transition-all flex-shrink-0 cursor-pointer"
      >
        <span>Book Now</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
