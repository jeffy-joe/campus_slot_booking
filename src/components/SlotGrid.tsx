import React from 'react';
import type { TimeSlot } from '../types';
import { Clock, ArrowRight } from 'lucide-react';

interface SlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotTime: string) => void;
  isSlotBooked: (timeRange: string) => boolean;
  isSlotRestricted?: (timeRange: string) => { isRestricted: boolean; reason?: string; description?: string };
  dateTitle: string;
  isToday?: boolean;
  onSelectNextDate?: () => void;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  isSlotBooked,
  isSlotRestricted,
  dateTitle,
  isToday = false,
  onSelectNextDate,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Available Slots - {dateTitle}
          </h3>
          {isToday && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
              Upcoming Timings Only
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">1-hour sessions</span>
      </div>

      {slots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-3.5 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 mx-auto shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              No More Upcoming Slots for Today
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              All time slots for today have already concluded. Please pick tomorrow or a future date to book an available arena.
            </p>
          </div>
          {onSelectNextDate && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onSelectNextDate}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <span>View Tomorrow's Slots</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map(slot => {
            const restriction = isSlotRestricted?.(slot.timeRange);
            const booked = isSlotBooked(slot.timeRange);
            const isSelected = selectedSlot === slot.timeRange;

            if (restriction?.isRestricted) {
              return (
                <div
                  key={slot.id}
                  title={restriction.description || restriction.reason || 'Restricted by Admin'}
                  className="py-3 px-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-medium flex items-center justify-between cursor-not-allowed select-none min-h-[44px]"
                >
                  <div className="flex flex-col text-left">
                    <span className="line-through decoration-amber-400 font-semibold">{slot.timeRange}</span>
                    {restriction.reason && (
                      <span className="text-[10px] text-amber-600 font-normal">
                        {restriction.reason}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-amber-200/80 px-2 py-0.5 rounded-full text-amber-800 tracking-wide">
                    Restricted
                  </span>
                </div>
              );
            }

            if (booked) {
              return (
                <div
                  key={slot.id}
                  className="py-3 px-4 rounded-xl border border-rose-200/70 bg-rose-50/60 text-rose-400 text-xs font-medium flex items-center justify-between cursor-not-allowed select-none min-h-[44px]"
                >
                  <span className="line-through decoration-rose-300">{slot.timeRange}</span>
                  <span className="text-[10px] font-bold uppercase bg-rose-100 px-2 py-0.5 rounded-full text-rose-500 tracking-wide">
                    Unavailable
                  </span>
                </div>
              );
            }

            return (
              <button
                key={slot.id}
                onClick={() => onSelectSlot(slot.timeRange)}
                className={`py-3 px-4 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold'
                    : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700 hover:bg-blue-50/30'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{slot.timeRange}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
