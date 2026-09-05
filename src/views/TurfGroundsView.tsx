import React from 'react';
import type { SportActivity } from '../types';
import { SportCard } from '../components/SportCard';
import { TurfGroundsIcon } from '../components/SportIcons';
import { ACTIVITIES } from '../data/sportsData';

interface TurfGroundsViewProps {
  onSelectSport: (sport: SportActivity) => void;
}

export const TurfGroundsView: React.FC<TurfGroundsViewProps> = ({ onSelectSport }) => {
  const turfActivities = ACTIVITIES.filter(a => a.category === 'turf');

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs flex-shrink-0">
          <TurfGroundsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Turf & Grounds
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Select the ground you want to book
          </p>
        </div>
      </div>

      {/* Turf Cards List */}
      <div className="space-y-3.5">
        {turfActivities.map(activity => (
          <SportCard
            key={activity.id}
            activity={activity}
            onBookNow={onSelectSport}
          />
        ))}
      </div>
    </div>
  );
};
