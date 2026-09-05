import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import type { SportActivity } from '../types';
import { SportIconRenderer } from '../components/SportIcons';
import { DateSelector } from '../components/DateSelector';
import { SlotGrid } from '../components/SlotGrid';
import { useAdminStore } from '../store/adminStore';
import { 
  getLiveBookingDates,
  STANDARD_TIME_SLOTS, 
  isDateToday, 
  isSlotUpcoming 
} from '../data/sportsData';
import type { AvailableDate } from '../data/sportsData';


interface SlotSelectionViewProps {
  sport: SportActivity;
  onBack: () => void;
  onContinue: (slotDetails: {
    sport: SportActivity;
    date: AvailableDate;
    timeSlot: string;
  }) => void;
  isSlotBooked: (activityId: string, dateKey: string, timeSlot: string) => boolean;
}

export const SlotSelectionView: React.FC<SlotSelectionViewProps> = ({
  sport,
  onBack,
  onContinue,
  isSlotBooked,
}) => {
  // Compute live booking dates fresh on every mount — never uses stale module-level constant
  const liveDates = React.useMemo(() => getLiveBookingDates(14), []);

  const [selectedDate, setSelectedDate] = useState<AvailableDate>(() => liveDates[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Periodically refresh current time every 30 seconds so slots stay accurately upcoming
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const { isSlotRestricted } = useAdminStore();

  const isToday = isDateToday(selectedDate.dateKey, currentTime);

  // Check if entire date is restricted for this category/sport
  const wholeDayRestriction = isSlotRestricted(selectedDate.dateKey, 'All Day', sport.category, sport.id);

  // For today's date, show only upcoming timing slots (startTime in the future)
  const availableSlots = React.useMemo(() => {
    return STANDARD_TIME_SLOTS.filter(slot => isSlotUpcoming(slot, isToday, currentTime));
  }, [isToday, currentTime]);

  const handleSlotSelect = (slotTime: string) => {
    const restriction = isSlotRestricted(selectedDate.dateKey, slotTime, sport.category, sport.id);
    if (restriction.isRestricted) return;
    setSelectedSlot(slotTime);
  };

  const handleContinue = () => {
    if (!selectedSlot) return;
    onContinue({
      sport,
      date: selectedDate,
      timeSlot: selectedSlot,
    });
  };

  const categoryLabel = sport.category === 'indoor' ? 'Indoor Games' : 'Turf & Grounds';

  return (
    <div className="space-y-7 max-w-4xl mx-auto pb-24">
      {/* Breadcrumb matching Screen 4 */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>{categoryLabel}</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">{sport.name}</span>
      </nav>

      {/* Activity Title Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 flex-shrink-0">
          <SportIconRenderer iconName={sport.iconName} size={32} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {sport.name}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Select date and time slot for your booking
          </p>
        </div>
      </div>

      {/* Date Picker Horizontal Carousel */}
      <DateSelector
        dates={liveDates}
        selectedDate={selectedDate}
        onSelectDate={date => {
          setSelectedDate(date);
          setSelectedSlot(null); // Reset or preserve
        }}
      />

      {/* Date-level Restriction Banner if all slots on this date are restricted */}
      {wholeDayRestriction.isRestricted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs sm:text-sm animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold">
              Facility Notice: Closed on {selectedDate.fullDateString} ({wholeDayRestriction.reason})
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              {wholeDayRestriction.description ||
                'This arena is temporarily unavailable on this date due to scheduled maintenance or campus events.'}
            </p>
          </div>
        </div>
      )}

      {/* Time Slot Grid */}
      <SlotGrid
        slots={availableSlots}
        selectedSlot={selectedSlot}
        onSelectSlot={handleSlotSelect}
        isSlotBooked={slotTime => isSlotBooked(sport.id, selectedDate.dateKey, slotTime)}
        isSlotRestricted={slotTime => isSlotRestricted(selectedDate.dateKey, slotTime, sport.category, sport.id)}
        dateTitle={selectedDate.fullDateString}
        isToday={isToday}
        onSelectNextDate={() => {
          const nextDate = liveDates[1];
          if (nextDate) {
            setSelectedDate(nextDate);
            setSelectedSlot(null);
          }
        }}
      />

      {/* Bottom Sticky Selection Bar matching Screen 4 */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
              Selected Slot
            </span>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {selectedSlot ? (
                <>
                  <span className="text-blue-600">{selectedDate.fullDateString}</span>
                  <span className="text-slate-400">•</span>
                  <span>{selectedSlot}</span>
                </>
              ) : (
                <span className="text-slate-500 font-normal italic">
                  No slot selected yet. Click an available slot above.
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={!selectedSlot}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs cursor-pointer ${
              selectedSlot
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
