import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { AvailableDate } from '../data/sportsData';

interface DateSelectorProps {
  dates: AvailableDate[];
  selectedDate: AvailableDate;
  onSelectDate: (date: AvailableDate) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onSelectDate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Select Date (Live Calendar)
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleScrollLeft}
            title="Scroll left"
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleScrollRight}
            title="Scroll right"
            className="w-7 h-7 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth"
      >
        {dates.map(item => {
          const isSelected = item.dateKey === selectedDate.dateKey;

          return (
            <button
              key={item.dateKey}
              onClick={() => onSelectDate(item)}
              className={`flex flex-col items-center justify-center min-w-[78px] py-3 px-3 rounded-2xl border transition-all duration-150 cursor-pointer flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white border-slate-200/90 text-slate-600 hover:border-blue-300 hover:bg-slate-50/70'
              }`}
            >
              <span className={`text-xs font-medium ${
                isSelected 
                  ? 'text-blue-100' 
                  : item.isToday 
                  ? 'text-blue-600 font-semibold' 
                  : 'text-slate-500'
              }`}>
                {item.dayName}
              </span>
              <span className={`text-sm font-bold mt-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {item.dayNumber} {item.monthShort}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
