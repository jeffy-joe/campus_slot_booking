import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Ban,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  Mail,
  Loader2,
  AlertTriangle,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useAdminStore, isSlotInsideRange } from '../../store/adminStore';
import { ACTIVITIES, parseSlotEndTime } from '../../data/sportsData';
import type { SlotRestriction, Booking } from '../../types';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { AdminFacilityGameModal } from '../../components/admin/AdminFacilityGameModal';
import { IndoorGamesIcon, TurfGroundsIcon, SportIconRenderer } from '../../components/SportIcons';
import { OptionPickerModal } from '../../components/admin/OptionPickerModal';
import type { PickerOption } from '../../components/admin/OptionPickerModal';

const REASON_OPTIONS: PickerOption[] = [
  { value: 'Maintenance', label: 'Maintenance & Repairs', description: 'Facility under scheduled maintenance or repairs', badge: 'Maintenance', badgeColor: 'bg-amber-100 text-amber-800' },
  { value: 'Event', label: 'College Tournament / Event', description: 'Reserved for college tournament or official event', badge: 'Event', badgeColor: 'bg-blue-100 text-blue-800' },
  { value: 'Weather', label: 'Adverse Weather Conditions', description: 'Rain, storms, or hazardous court conditions', badge: 'Weather', badgeColor: 'bg-sky-100 text-sky-800' },
  { value: 'Holiday', label: 'Campus Holiday / Closed', description: 'Official campus holiday or facility closure', badge: 'Holiday', badgeColor: 'bg-rose-100 text-rose-800' },
  { value: 'Other', label: 'Other Administrative Reason', description: 'Administrative requirement or special restriction', badge: 'Other', badgeColor: 'bg-slate-100 text-slate-800' },
];

interface AdminRestrictSlotsViewProps {
  bookings?: Booking[];
  onCancelBooking?: (
    bookingId: string,
    reason?: string,
    emailStatus?: 'sent' | 'failed' | 'simulated',
    emailError?: string
  ) => void;
}

const PRESET_SLOT_OPTIONS = [
  { value: '10:00 AM - 11:00 AM', label: '10:00 AM - 11:00 AM (1 Hour)', group: 'Individual Slots' },
  { value: '11:00 AM - 12:00 PM', label: '11:00 AM - 12:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '12:00 PM - 01:00 PM', label: '12:00 PM - 01:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '01:00 PM - 02:00 PM', label: '01:00 PM - 02:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '02:00 PM - 03:00 PM', label: '02:00 PM - 03:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '03:00 PM - 04:00 PM', label: '03:00 PM - 04:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '04:00 PM - 05:00 PM', label: '04:00 PM - 05:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '05:00 PM - 06:00 PM', label: '05:00 PM - 06:00 PM (1 Hour)', group: 'Individual Slots' },
  { value: '10:00 AM - 01:00 PM', label: '10:00 AM - 01:00 PM (Morning Block - 3h)', group: 'Multi-Hour Blocks' },
  { value: '01:00 PM - 03:00 PM', label: '01:00 PM - 03:00 PM (Afternoon Block - 2h)', group: 'Multi-Hour Blocks' },
  { value: '03:00 PM - 06:00 PM', label: '03:00 PM - 06:00 PM (Evening Block - 3h)', group: 'Multi-Hour Blocks' },
  { value: '10:00 AM - 06:00 PM', label: '10:00 AM - 06:00 PM (Full Day Operating Hours)', group: 'Multi-Hour Blocks' },
  { value: 'Custom', label: 'Custom Time Range...', group: 'Custom' },
];

export const AdminRestrictSlotsView: React.FC<AdminRestrictSlotsViewProps> = ({
  bookings = [],
  onCancelBooking,
}) => {
  const { restrictions, addRestriction, removeRestriction } = useAdminStore();

  const [restrictMode, setRestrictMode] = useState<'date' | 'slot'>('slot');
  const [facility, setFacility] = useState<'indoor' | 'turf' | 'all'>('indoor');
  const [selectedGame, setSelectedGame] = useState<string>('all');

  // Real-time clock updated every 10 seconds
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const getLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayDateKey = useMemo(() => getLocalDateStr(currentTime), [currentTime]);

  const tomorrowDateKey = useMemo(() => {
    const tomorrow = new Date(currentTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateStr(tomorrow);
  }, [currentTime]);

  // Campus sports facilities operate from 10:00 AM to 06:00 PM (18:00)
  // When current time reaches or passes 18:00, all slots for today are over!
  const isTodayTimeOver = useMemo(() => {
    const hours = currentTime.getHours();
    return hours >= 18;
  }, [currentTime]);

  // Minimum selectable date:
  // If today is over (>= 18:00), minimum selectable date is tomorrow!
  // Otherwise, minimum selectable date is today.
  const minDateKey = useMemo(() => {
    return isTodayTimeOver ? tomorrowDateKey : todayDateKey;
  }, [isTodayTimeOver, tomorrowDateKey, todayDateKey]);

  const [dateKey, setDateKey] = useState<string>(() => {
    const now = new Date();
    const isOver = now.getHours() >= 18;
    if (isOver) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const y = tomorrow.getFullYear();
      const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Effective date key ensures admin can never select or submit a date in the past
  const effectiveDateKey = dateKey < minDateKey ? minDateKey : dateKey;

  // Helper to check if a specific time slot on the selected date has already ended
  const checkIsSlotOver = useCallback(
    (slotValue: string): boolean => {
      if (effectiveDateKey !== todayDateKey) {
        return false; // Future dates are never over
      }
      if (isTodayTimeOver) {
        return true; // All slots for today are over
      }
      if (slotValue === 'Custom') {
        return false;
      }

      const parsed = parseSlotEndTime(slotValue);
      if (!parsed) return false;

      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();

      if (parsed.hour < currentHour) return true;
      if (parsed.hour === currentHour && parsed.minute <= currentMinute) return true;

      return false;
    },
    [effectiveDateKey, todayDateKey, isTodayTimeOver, currentTime]
  );

  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 11:00 AM');
  const [customSlot, setCustomSlot] = useState<string>('');
  const [reason, setReason] = useState<SlotRestriction['reason']>('Maintenance');
  const [description, setDescription] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'indoor' | 'turf'>('all');
  // Default restriction list to show today only
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [notification, setNotification] = useState<string | null>(null);
  const [restrictionToDelete, setRestrictionToDelete] = useState<SlotRestriction | null>(null);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  // Facility & Game selection pop-up modal state
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  // Time slot & Reason pop-up modal states
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [showReasonPicker, setShowReasonPicker] = useState(false);

  const selectedActivity = useMemo(() => {
    if (selectedGame === 'all') return undefined;
    return ACTIVITIES.find(a => a.id === selectedGame);
  }, [selectedGame]);

  const [isProcessing, setIsProcessing] = useState(false);

  const slotPickerOptions: PickerOption[] = useMemo(() => {
    return PRESET_SLOT_OPTIONS.map(slot => {
      const isOver = checkIsSlotOver(slot.value);
      return {
        value: slot.value,
        label: slot.label,
        group: slot.group,
        disabled: isOver,
        description: isOver ? 'This time slot has already ended for today' : undefined,
        badge: isOver ? 'Ended' : undefined,
        badgeColor: isOver ? 'bg-slate-100 text-slate-400' : undefined,
      };
    });
  }, [checkIsSlotOver]);

  // Auto-advance to next upcoming slot if selected slot has ended today
  const effectiveTimeSlot = useMemo(() => {
    if (effectiveDateKey === todayDateKey && !isTodayTimeOver && timeSlot !== 'Custom' && checkIsSlotOver(timeSlot)) {
      const nextAvailable = PRESET_SLOT_OPTIONS.find(
        s => s.value !== 'Custom' && !checkIsSlotOver(s.value)
      );
      return nextAvailable ? nextAvailable.value : timeSlot;
    }
    return timeSlot;
  }, [effectiveDateKey, todayDateKey, isTodayTimeOver, timeSlot, checkIsSlotOver]);

  const formatDateDisplay = (isoDate: string): string => {
    try {
      const [y, m, d] = isoDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoDate;
    }
  };

  const activeSlot =
    restrictMode === 'date'
      ? 'All Day'
      : effectiveTimeSlot === 'Custom'
      ? customSlot.trim() || '10:00 AM - 06:00 PM'
      : effectiveTimeSlot;

  const currentFacilityCategory =
    selectedGame !== 'all'
      ? (ACTIVITIES.find(a => a.id === selectedGame)?.category || facility)
      : facility;

  const conflictingBookings = useMemo(() => {
    return bookings.filter(b => {
      if (b.status !== 'confirmed') return false;
      if (b.dateKey !== effectiveDateKey) return false;
      if (currentFacilityCategory !== 'all' && b.category !== currentFacilityCategory) return false;
      if (selectedGame !== 'all' && b.activityId !== selectedGame) return false;
      if (restrictMode === 'date' || activeSlot === 'All Day' || b.timeSlot === activeSlot) return true;
      return isSlotInsideRange(b.timeSlot, activeSlot);
    });
  }, [bookings, effectiveDateKey, currentFacilityCategory, selectedGame, restrictMode, activeSlot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (effectiveDateKey < minDateKey) {
      setValidationAlert(
        isTodayTimeOver
          ? "Today's sports facility hours (10:00 AM - 06:00 PM) have ended. Please select tomorrow or a future date."
          : "Cannot restrict a past date. Please choose today or a future date."
      );
      return;
    }

    if (restrictMode === 'slot') {
      if (effectiveTimeSlot === 'Custom') {
        const parsed = parseSlotEndTime(customSlot);
        if (parsed && effectiveDateKey === todayDateKey) {
          const currentHour = currentTime.getHours();
          const currentMinute = currentTime.getMinutes();
          if (parsed.hour < currentHour || (parsed.hour === currentHour && parsed.minute <= currentMinute)) {
            setValidationAlert("The custom time slot you entered has already ended for today. Please enter an upcoming time slot.");
            return;
          }
        }
      } else if (checkIsSlotOver(effectiveTimeSlot)) {
        setValidationAlert("The selected time slot has already ended for today. Please select an upcoming slot.");
        return;
      }
    }

    setIsProcessing(true);

    const finalSlot = activeSlot;

    const targetActivity = selectedGame !== 'all' ? ACTIVITIES.find(a => a.id === selectedGame) : undefined;
    const targetActivityId = targetActivity ? targetActivity.id : 'all';
    const targetActivityName = targetActivity ? targetActivity.name : 'All Games';

    const facilityName =
      targetActivity
        ? (targetActivity.category === 'indoor' ? 'Indoor Games' : 'Turf & Grounds')
        : (facility === 'indoor'
          ? 'Indoor Games'
          : facility === 'turf'
          ? 'Turf & Grounds'
          : 'All Facilities');

    const facilityCategory = targetActivity ? targetActivity.category : facility;

    addRestriction({
      facilityCategory,
      facilityName,
      activityId: targetActivityId,
      activityName: targetActivityName,
      type: restrictMode,
      dateKey: effectiveDateKey,
      dateString: formatDateDisplay(effectiveDateKey),
      timeSlot: finalSlot,
      reason,
      description: description.trim() || undefined,
    });

    const targetLabel = targetActivity ? `${targetActivity.name} (${facilityName})` : facilityName;
    const cancelReason = `Facility Restriction (${reason})${description.trim() ? `: ${description.trim()}` : ''}`;

    let cancelledCount = 0;
    if (conflictingBookings.length > 0) {
      for (const cb of conflictingBookings) {
        cancelledCount++;
        let emailStatus: 'sent' | 'failed' | 'simulated' = 'sent';
        let emailErr: string | undefined;

        try {
          const res = await fetch('/api/send-cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: cb.id,
              userName: cb.userName,
              registrationNumber: cb.registrationNumber,
              userEmail: cb.userEmail,
              activityName: cb.activityName,
              dateString: cb.dateString,
              timeSlot: cb.timeSlot,
              venue: cb.venue,
              reason: cancelReason,
              cancelledBy: 'Campus Sports Administration',
            }),
          });

          const data = await res.json();
          if (data && data.success) {
            emailStatus = data.mode === 'smtp_ethereal' ? 'simulated' : 'sent';
          } else {
            emailStatus = 'failed';
            emailErr = data?.error;
          }
        } catch (err: any) {
          emailStatus = 'failed';
          emailErr = err?.message;
        }

        if (onCancelBooking) {
          onCancelBooking(cb.id, cancelReason, emailStatus, emailErr);
        }
      }
    }

    setIsProcessing(false);
    if (cancelledCount > 0) {
      setNotification(
        `Added restriction for ${targetLabel}. ${cancelledCount} active reservation(s) were cancelled and cancellation emails dispatched.`
      );
    } else {
      setNotification(`Successfully added restriction for ${targetLabel} on ${formatDateDisplay(effectiveDateKey)}.`);
    }
    setDescription('');
    setTimeout(() => setNotification(null), 6000);
  };

  const filteredRestrictions = restrictions.filter(r => {
    const matchesFacility = facilityFilter === 'all' || r.facilityCategory === facilityFilter;
    const matchesDate = dateFilter === 'all' || r.dateKey === todayDateKey;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.facilityName.toLowerCase().includes(q) ||
      (r.activityName && r.activityName.toLowerCase().includes(q)) ||
      r.reason.toLowerCase().includes(q) ||
      r.dateString.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q));
    return matchesFacility && matchesDate && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Restrict Slots & Dates
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Block venues or specific time slots for maintenance, campus events, or bad weather.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {restrictions.length} Active Restrictions
          </span>
        </div>
      </div>

      {notification && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Left */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Create Restriction
              </h2>
              <p className="text-[11px] text-slate-400">
                Instantly blocks bookings for students on these dates.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRestrictMode('date')}
              className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                restrictMode === 'date'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span><span className="hidden sm:inline">Restrict by </span>Date</span>
            </button>
            <button
              type="button"
              onClick={() => setRestrictMode('slot')}
              className={`py-2 px-2.5 sm:px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                restrictMode === 'slot'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span><span className="hidden sm:inline">Restrict by </span>Time Slot</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Facility / Game to Restrict
              </label>

              {/* Interactive Pop-up Selector Card matching Student UI */}
              <div className="p-3 sm:p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-blue-300 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Icon container - Consistent Blue Theme */}
                  {selectedActivity ? (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs bg-blue-50 border border-blue-200 text-blue-600">
                      <SportIconRenderer
                        iconName={selectedActivity.iconName}
                        size={26}
                        className="text-blue-600"
                      />
                    </div>
                  ) : facility === 'indoor' ? (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <IndoorGamesIcon className="w-6 h-6" />
                    </div>
                  ) : facility === 'turf' ? (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <TurfGroundsIcon className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}

                  {/* Text details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {selectedActivity
                          ? selectedActivity.name
                          : facility === 'indoor'
                          ? 'All Indoor Games'
                          : facility === 'turf'
                          ? 'All Turf & Grounds'
                          : 'All Facilities (Campus Wide)'}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {selectedActivity
                          ? selectedActivity.category === 'indoor'
                            ? 'Indoor Game'
                            : 'Turf Sport'
                          : facility === 'indoor'
                          ? 'Indoor Category'
                          : facility === 'turf'
                          ? 'Turf Category'
                          : 'Campus Wide'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {selectedActivity
                        ? selectedActivity.description
                        : facility === 'indoor'
                        ? 'Carrom, Table Tennis, Chess, Table Soccer'
                        : facility === 'turf'
                        ? 'Futsal, Pickle Ball, Cricket Nets, Volleyball'
                        : 'Locks every sports facility across the entire campus'}
                    </p>
                  </div>
                </div>

                {/* Change in Pop-up Button */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsFacilityModalOpen(true)}
                    className="px-3 py-2 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                  >
                    Select in Pop-up
                  </button>
                  {selectedActivity && (
                    <button
                      type="button"
                      onClick={() => setSelectedGame('all')}
                      title="Clear specific game (restrict whole facility)"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Restriction Date
                </label>
                {effectiveDateKey === todayDateKey && !isTodayTimeOver && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Today (Live)
                  </span>
                )}
                {isTodayTimeOver && effectiveDateKey === tomorrowDateKey && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Today Ended (Min: Tomorrow)
                  </span>
                )}
              </div>
              <input
                type="date"
                min={minDateKey}
                value={effectiveDateKey}
                onChange={e => {
                  const val = e.target.value;
                  if (!val || val >= minDateKey) {
                    setDateKey(val);
                  }
                }}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {isTodayTimeOver && (
                <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                  Today's facility hours (10:00 AM - 06:00 PM) have ended. Minimum selectable date is tomorrow.
                </p>
              )}
              {effectiveDateKey === todayDateKey && !isTodayTimeOver && (
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  Past time slots for today are automatically disabled in real time.
                </p>
              )}
            </div>

            {restrictMode === 'slot' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Time Slot to Block</span>
                  <span className="text-[10px] text-slate-400 font-normal">Select in pop-up</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowSlotPicker(true)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <span className="truncate">
                    {PRESET_SLOT_OPTIONS.find(s => s.value === effectiveTimeSlot)?.label || effectiveTimeSlot}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
                <OptionPickerModal
                  isOpen={showSlotPicker}
                  onClose={() => setShowSlotPicker(false)}
                  title="Select Time Slot to Block"
                  subtitle="Choose standard 1-hour slot, multi-hour block, or custom range"
                  options={slotPickerOptions}
                  value={effectiveTimeSlot}
                  onChange={val => setTimeSlot(val)}
                />

                {effectiveTimeSlot === 'Custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="e.g. 02:00 PM - 05:30 PM"
                      value={customSlot}
                      onChange={e => setCustomSlot(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Format: HH:MM AM/PM - HH:MM AM/PM
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Reason for Restriction</span>
                <span className="text-[10px] text-slate-400 font-normal">Select in pop-up</span>
              </label>
              <button
                type="button"
                onClick={() => setShowReasonPicker(true)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all"
              >
                <span className="truncate">
                  {REASON_OPTIONS.find(r => r.value === reason)?.label || reason}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
              <OptionPickerModal
                isOpen={showReasonPicker}
                onClose={() => setShowReasonPicker(false)}
                title="Reason for Restriction"
                subtitle="Select the primary reason for blocking facilities or slots"
                options={REASON_OPTIONS}
                value={reason}
                onChange={val => setReason(val as SlotRestriction['reason'])}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Annual wooden court polishing and net tightening..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            {conflictingBookings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{conflictingBookings.length} Active Booking(s) Will Be Cancelled</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Students holding these reservations will automatically receive a cancellation email notice explaining the {reason.toLowerCase()} reason.
                </p>
                <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-800 font-semibold">
                  <Mail className="w-3 h-3 text-amber-600" />
                  <span>Automated SMTP cancellation notice will be delivered</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Applying & Notifying Students...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>
                    {restrictMode === 'date' ? 'Block Entire Date' : 'Apply Time Slot Restriction'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* List Right */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                  {dateFilter === 'today' ? "Today's Restrictions" : 'All Restrictions'} ({filteredRestrictions.length})
                </h2>
                <p className="text-[11px] text-slate-400">
                  {dateFilter === 'today' ? "Showing today's restricted slots only." : 'Slots locked from student bookings in real-time.'}
                </p>
              </div>

              {/* Date scope toggle */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs self-start sm:self-auto">
                <button
                  onClick={() => setDateFilter('today')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                    dateFilter === 'today'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                    dateFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Facility filter */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs self-start">
              <button
                onClick={() => setFacilityFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  facilityFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFacilityFilter('indoor')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  facilityFilter === 'indoor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Indoor
              </button>
              <button
                onClick={() => setFacilityFilter('turf')}
                className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-all ${
                  facilityFilter === 'turf'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Turf
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by facility, date or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {filteredRestrictions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <Ban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No restrictions found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All facilities and time slots are currently open for booking.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards (< sm) */}
              <div className="sm:hidden divide-y divide-slate-100">
                {filteredRestrictions.map(r => {
                  const isAllDay = r.type === 'date' || r.timeSlot === 'All Day';
                  const hasSpecificGame = r.activityName && r.activityName !== 'All Games';
                  return (
                    <div key={r.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{r.dateString}</div>
                          <div className="text-[10px] text-slate-400">{r.dateKey}</div>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.reason === 'Maintenance'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : r.reason === 'Event'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : r.reason === 'Holiday'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {r.reason}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">
                            {hasSpecificGame ? r.activityName : r.facilityName}
                          </div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold ${
                              r.facilityCategory === 'indoor'
                                ? 'bg-purple-100 text-purple-800'
                                : r.facilityCategory === 'turf'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {hasSpecificGame
                              ? (r.facilityCategory === 'indoor' ? 'Indoor Games' : 'Turf & Grounds')
                              : 'All Facility Games'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold text-xs ${
                              isAllDay ? 'text-red-700 font-bold' : 'text-slate-800'
                            }`}
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            {r.timeSlot}
                          </span>
                        </div>
                      </div>

                      {r.description && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {r.description}
                        </p>
                      )}

                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => setRestrictionToDelete(r)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Tablet Table (sm+) */}
              <div className="hidden sm:block overflow-x-auto border border-slate-200/80 rounded-xl">
                <table className="w-full text-left text-xs min-w-[550px]">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Game & Facility</th>
                      <th className="py-3 px-3">Time Slot</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRestrictions.map(r => {
                      const isAllDay = r.type === 'date' || r.timeSlot === 'All Day';
                      const hasSpecificGame = r.activityName && r.activityName !== 'All Games';
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{r.dateString}</div>
                            <div className="text-[10px] text-slate-400">{r.dateKey}</div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {hasSpecificGame ? r.activityName : r.facilityName}
                            </div>
                            <span
                              className={`inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                r.facilityCategory === 'indoor'
                                  ? 'bg-purple-100 text-purple-800'
                                  : r.facilityCategory === 'turf'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {hasSpecificGame
                                ? (r.facilityCategory === 'indoor' ? 'Indoor Games' : 'Turf & Grounds')
                                : 'All Facility Games'}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isAllDay ? 'text-red-700 font-bold' : 'text-slate-800'
                              }`}
                            >
                              <Clock className="w-3 h-3 text-slate-400" />
                              {r.timeSlot}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center w-fit px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  r.reason === 'Maintenance'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : r.reason === 'Event'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : r.reason === 'Holiday'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {r.reason}
                              </span>
                              {r.description && (
                                <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[180px]">
                                  {r.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setRestrictionToDelete(r)}
                              title="Delete Restriction"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Popup Dialog */}
      <ConfirmDialog
        isOpen={!!restrictionToDelete}
        title="Remove Restriction"
        message={
          restrictionToDelete ? (
            <span>
              Are you sure you want to remove the restriction for{' '}
              <strong className="font-bold text-slate-900">
                {restrictionToDelete.activityName && restrictionToDelete.activityName !== 'All Games'
                  ? `${restrictionToDelete.activityName} (${restrictionToDelete.facilityName})`
                  : restrictionToDelete.facilityName}
              </strong>{' '}
              on <strong className="font-bold text-slate-900">{restrictionToDelete.dateString}</strong> ({restrictionToDelete.timeSlot})?
              <br />
              <span className="text-slate-500 mt-1 block">
                The facility and slot will be reopened immediately for student bookings.
              </span>
            </span>
          ) : null
        }
        confirmText="OK"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (restrictionToDelete) {
            const targetName =
              restrictionToDelete.activityName && restrictionToDelete.activityName !== 'All Games'
                ? `${restrictionToDelete.activityName} (${restrictionToDelete.facilityName})`
                : restrictionToDelete.facilityName;
            removeRestriction(restrictionToDelete.id);
            setNotification(`Removed restriction for ${targetName} on ${restrictionToDelete.dateString}.`);
            setRestrictionToDelete(null);
            setTimeout(() => setNotification(null), 4000);
          }
        }}
        onCancel={() => setRestrictionToDelete(null)}
      />

      {/* Custom Validation Alert Popup Dialog */}
      <ConfirmDialog
        isOpen={!!validationAlert}
        title="Notice"
        message={validationAlert}
        confirmText="OK"
        hideCancel={true}
        variant="warning"
        onConfirm={() => setValidationAlert(null)}
        onCancel={() => setValidationAlert(null)}
      />

      {/* Pop-up Modal: Facility & Game Selection (Category -> Sport) matching Student UI */}
      <AdminFacilityGameModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        currentFacility={facility}
        currentGameId={selectedGame}
        onSelect={({ facility: newFacility, gameId: newGameId }) => {
          setFacility(newFacility);
          setSelectedGame(newGameId);
        }}
      />
    </div>
  );
};
