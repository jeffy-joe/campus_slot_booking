import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  Loader2,
  X,
  ChevronDown
} from 'lucide-react';
import type { Booking } from '../../types';
import { isBookingUpcoming } from '../../data/sportsData';
import { OptionPickerModal } from '../../components/admin/OptionPickerModal';
import type { PickerOption } from '../../components/admin/OptionPickerModal';

const STATUS_OPTIONS: PickerOption[] = [
  { value: 'all', label: 'All Statuses', description: 'Show all bookings regardless of status' },
  { value: 'confirmed', label: 'Confirmed Only', description: 'Show only active confirmed reservations', badge: 'Confirmed', badgeColor: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Cancelled Only', description: 'Show only cancelled bookings', badge: 'Cancelled', badgeColor: 'bg-red-100 text-red-700' },
];

const CATEGORY_OPTIONS: PickerOption[] = [
  { value: 'all', label: 'All Facilities', description: 'Show bookings from every facility' },
  { value: 'indoor', label: 'Indoor Games', description: 'Carrom, Table Tennis, Chess, Table Soccer', badge: 'Indoor', badgeColor: 'bg-purple-100 text-purple-700' },
  { value: 'turf', label: 'Turf & Grounds', description: 'Futsal, Pickle Ball, Cricket Nets, Volleyball', badge: 'Turf', badgeColor: 'bg-emerald-100 text-emerald-700' },
];

interface AdminBookingsViewProps {
  bookings: Booking[];
  onCancelBooking?: (
    bookingId: string,
    reason?: string,
    emailStatus?: 'sent' | 'failed' | 'simulated',
    emailError?: string
  ) => void;
}

export const AdminBookingsView: React.FC<AdminBookingsViewProps> = ({
  bookings,
  onCancelBooking,
}) => {
  // Purely live user bookings sorted by recency
  const allBookings = useMemo(() => {
    return [...bookings].sort(
      (a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime()
    );
  }, [bookings]);

  // Real-time clock updated every 15 seconds to evaluate upcoming slots accurately
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'indoor' | 'turf'>('all');
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  // Default to today — admin sees today's bookings first
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 8;

  const formatDateDisplay = (isoDate: string): string => {
    if (!isoDate) return 'All Dates';
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

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState('Facility Maintenance & Repairs');
  const [showCancelReasonPicker, setShowCancelReasonPicker] = useState(false);
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelNotification, setCancelNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const PRESET_CANCELLATION_REASONS = [
    'Facility Maintenance & Repairs',
    'Inter-college Tournament / Campus Event',
    'Inclement Weather / Court Safety',
    'Emergency Facility Closure',
    'Schedule Conflict / Administrative Decision',
    'Other (Specify below)',
  ];

  const cancelReasonOptions: PickerOption[] = useMemo(() => {
    return PRESET_CANCELLATION_REASONS.map(r => ({
      value: r,
      label: r,
    }));
  }, []);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);

    const finalReason =
      cancelReasonPreset === 'Other (Specify below)'
        ? customCancelReason.trim() || 'Administrative Facility Requirement'
        : customCancelReason.trim()
        ? `${cancelReasonPreset}: ${customCancelReason.trim()}`
        : cancelReasonPreset;

    let emailSent = false;
    let emailStatus: 'sent' | 'failed' | 'simulated' = 'sent';
    let emailErr: string | undefined;

    try {
      const res = await fetch('/api/send-cancellation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingToCancel.id,
          userName: bookingToCancel.userName,
          registrationNumber: bookingToCancel.registrationNumber,
          userEmail: bookingToCancel.userEmail,
          activityName: bookingToCancel.activityName,
          dateString: bookingToCancel.dateString,
          timeSlot: bookingToCancel.timeSlot,
          venue: bookingToCancel.venue,
          reason: finalReason,
          cancelledBy: 'Campus Sports Administration',
        }),
      });

      const data = await res.json();
      if (data && data.success) {
        emailSent = true;
        emailStatus = data.mode === 'smtp_ethereal' ? 'simulated' : 'sent';
      } else {
        emailStatus = 'failed';
        emailErr = data?.error || 'Failed to dispatch cancellation email';
      }
    } catch (err: any) {
      emailStatus = 'failed';
      emailErr = err?.message || 'Network error communicating with SMTP server';
    }

    if (onCancelBooking) {
      onCancelBooking(bookingToCancel.id, finalReason, emailStatus, emailErr);
    }

    if (emailSent) {
      setCancelNotification({
        type: 'success',
        message: `Slot #${bookingToCancel.id} cancelled. Official notification email dispatched to ${bookingToCancel.userEmail}.`,
      });
    } else {
      setCancelNotification({
        type: 'error',
        message: `Slot #${bookingToCancel.id} cancelled. Email notice failed to send: ${emailErr || 'SMTP error'}.`,
      });
    }

    setIsCancelling(false);
    setBookingToCancel(null);
    setCustomCancelReason('');
    setCancelReasonPreset('Facility Maintenance & Repairs');
    setTimeout(() => setCancelNotification(null), 6000);
  };

  const filteredBookings = useMemo(() => {
    return allBookings.filter(b => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (b.userName || '').toLowerCase().includes(q) ||
        (b.registrationNumber || '').toLowerCase().includes(q) ||
        (b.activityName || '').toLowerCase().includes(q) ||
        (b.id || '').toLowerCase().includes(q) ||
        (b.venue || '').toLowerCase().includes(q) ||
        (b.userEmail || '').toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;

      let matchesDate = true;
      if (selectedDate && b.dateKey !== selectedDate) matchesDate = false;

      return matchesSearch && matchesStatus && matchesCategory && matchesDate;
    });
  }, [allBookings, searchQuery, statusFilter, categoryFilter, selectedDate]);

  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage) || 1;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const confirmedCount = allBookings.filter(b => b.status === 'confirmed').length;
  const cancelledCount = allBookings.filter(b => b.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Showing today's bookings by default. Use the date filter to view other days.
          </p>
        </div>

        {/* Stats Pill Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">
            Total: {allBookings.length}
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {confirmedCount} Confirmed
          </span>
          <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            {cancelledCount} Cancelled
          </span>
        </div>
      </div>

      {/* Cancellation Success/Error Notification */}
      {cancelNotification && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium border animate-in fade-in slide-in-from-top-2 ${
            cancelNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {cancelNotification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span className="flex-1">{cancelNotification.message}</span>
        </div>
      )}

      {/* Filter Toolbar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
        {/* TOP ROW: High-Visibility Date Selection (Visible on Mobile & Desktop) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Date Selection
                </span>
                {selectedDate === todayKey && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                    Today
                  </span>
                )}
                {!selectedDate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    All Dates
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {selectedDate ? formatDateDisplay(selectedDate) : 'Showing bookings for all dates'}
              </span>
            </div>
          </div>

          {/* Quick Date Presets and Native Date Input */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setSelectedDate(todayKey);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDate === todayKey
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !selectedDate
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Dates
            </button>

            {/* Styled Date Input */}
            <div className="relative flex-1 sm:flex-initial min-w-[150px]">
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-h-[34px]"
                aria-label="Select booking date"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Search and Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll no, sport, ID..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Status filter */}
          <div className="lg:col-span-3">
            <button
              type="button"
              onClick={() => setShowStatusPicker(true)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <span className="truncate">
                {statusFilter === 'all'
                  ? 'Status: All'
                  : statusFilter === 'confirmed'
                  ? 'Confirmed Only'
                  : 'Cancelled Only'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>
            <OptionPickerModal
              isOpen={showStatusPicker}
              onClose={() => setShowStatusPicker(false)}
              title="Filter by Booking Status"
              subtitle="Choose which status category to display"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={val => {
                setStatusFilter(val as 'all' | 'confirmed' | 'cancelled');
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Category filter */}
          <div className="lg:col-span-3">
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between gap-2 cursor-pointer transition-all"
            >
              <span className="truncate">
                {categoryFilter === 'all'
                  ? 'Facility: All'
                  : categoryFilter === 'indoor'
                  ? 'Indoor Games'
                  : 'Turf & Grounds'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </button>
            <OptionPickerModal
              isOpen={showCategoryPicker}
              onClose={() => setShowCategoryPicker(false)}
              title="Filter by Facility Category"
              subtitle="Select arena or facility type"
              options={CATEGORY_OPTIONS}
              value={categoryFilter}
              onChange={val => {
                setCategoryFilter(val as 'all' | 'indoor' | 'turf');
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || selectedDate !== todayKey) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Showing {filteredBookings.length} matching result{filteredBookings.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setSelectedDate(todayKey);
                setCurrentPage(1);
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Reset to Today
            </button>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {paginatedBookings.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {allBookings.length === 0 ? 'No reservations yet' : 'No bookings match criteria'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {allBookings.length === 0
                ? 'Student bookings will appear here in real time as reservations are made.'
                : 'Try adjusting your search terms or filters.'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {paginatedBookings.map(b => (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                      {b.id}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {b.status === 'confirmed' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      <span className="capitalize">{b.status}</span>
                    </span>
                  </div>

                  <div>
                    <div className="font-bold text-sm text-slate-900">{b.userName}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono font-semibold text-slate-700">{b.registrationNumber}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{b.userEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{b.activityName}</div>
                      <span
                        className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                          b.category === 'indoor'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {b.category === 'indoor' ? 'Indoor Games' : 'Turf & Grounds'}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-slate-900 text-xs">{b.dateString}</div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{b.timeSlot}</span>
                      </div>
                    </div>
                  </div>

                  {b.status === 'cancelled' && (
                    <div className="bg-red-50/70 border border-red-100 rounded-lg p-2 text-[11px] text-red-800 space-y-1">
                      {b.cancellationReason && (
                        <div>
                          <span className="font-bold">Reason:</span> {b.cancellationReason}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>
                          Email Notice:{' '}
                          {b.cancellationEmailStatus === 'sent' || b.cancellationEmailStatus === 'simulated'
                            ? 'Dispatched'
                            : b.cancellationEmailStatus === 'failed'
                            ? 'Failed'
                            : 'Dispatched'}
                        </span>
                      </div>
                    </div>
                  )}

                  {b.status === 'confirmed' && onCancelBooking && (
                    isBookingUpcoming(b, currentTime) ? (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => {
                            setCancelReasonPreset('Facility Maintenance & Repairs');
                            setCustomCancelReason('');
                            setBookingToCancel(b);
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Booking</span>
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 flex justify-end">
                        <span className="text-[11px] font-medium text-slate-400 italic">
                          Slot Ended / Past
                        </span>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table (sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Sport & Facility</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedBookings.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {b.id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.userName}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono font-semibold text-slate-700">{b.registrationNumber}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{b.userEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{b.activityName}</div>
                        <span
                          className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                            b.category === 'indoor'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {b.category === 'indoor' ? 'Indoor Games' : 'Turf & Grounds'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{b.dateString}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{b.timeSlot}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {b.status === 'confirmed' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="capitalize">{b.status}</span>
                        </span>

                        {b.status === 'cancelled' && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            {b.cancellationReason && (
                              <span
                                className="text-[10px] text-slate-600 max-w-[160px] truncate block"
                                title={b.cancellationReason}
                              >
                                {b.cancellationReason}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-slate-400" />
                              {b.cancellationEmailStatus === 'sent' || b.cancellationEmailStatus === 'simulated'
                                ? 'Notified via Mail'
                                : b.cancellationEmailStatus === 'failed'
                                ? 'Mail Failed'
                                : 'Notified'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {b.status === 'confirmed' && onCancelBooking && (
                          isBookingUpcoming(b, currentTime) ? (
                            <button
                              onClick={() => {
                                setCancelReasonPreset('Facility Maintenance & Repairs');
                                setCustomCancelReason('');
                                setBookingToCancel(b);
                              }}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                              title="Cancel upcoming reservation"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Cancel</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400 italic">
                              Slot Ended
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-slate-50/60 border-t border-slate-200/80 text-xs">
          <span className="text-slate-500 text-center sm:text-left">
            Showing Page {currentPage} of {totalPages} ({filteredBookings.length} total records)
          </span>

          {/* Mobile pagination */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white cursor-pointer font-medium text-xs"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-white cursor-pointer font-medium text-xs"
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-white cursor-pointer font-medium"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-md font-bold text-xs transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-white cursor-pointer font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Admin Slot Cancellation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-6 space-y-4 relative">
            <button
              onClick={() => {
                if (!isCancelling) {
                  setBookingToCancel(null);
                  setCustomCancelReason('');
                }
              }}
              disabled={isCancelling}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cancel Slot Reservation
                </h3>
                <p className="text-xs text-slate-500">
                  The student will automatically receive a cancellation email notice.
                </p>
              </div>
            </div>

            {/* Target Booking Info Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  #{bookingToCancel.id}
                </span>
                <span className="font-bold text-slate-800">{bookingToCancel.activityName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block">Student</span>
                  <span className="font-semibold text-slate-800">{bookingToCancel.userName}</span>
                  <span className="text-slate-400 block font-mono">{bookingToCancel.registrationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Recipient Email</span>
                  <span className="font-semibold text-slate-800 break-all">{bookingToCancel.userEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Slot Date</span>
                  <span className="font-semibold text-slate-800">{bookingToCancel.dateString}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Slot Time</span>
                  <span className="font-semibold text-slate-800">{bookingToCancel.timeSlot}</span>
                </div>
              </div>
            </div>

            {/* Cancellation Form */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>
                    Reason for Cancellation <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Select in pop-up</span>
                </label>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setShowCancelReasonPicker(true)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 hover:border-red-300 hover:bg-red-50/30 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <span className="truncate">{cancelReasonPreset}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
                <OptionPickerModal
                  isOpen={showCancelReasonPicker}
                  onClose={() => setShowCancelReasonPicker(false)}
                  title="Reason for Cancellation"
                  subtitle="Select the official reason for cancelling this booking"
                  options={cancelReasonOptions}
                  value={cancelReasonPreset}
                  onChange={val => setCancelReasonPreset(val)}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This administrative reason will be included in the automated cancellation email sent to the student.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Additional Notes / Reason Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Due to electrical maintenance in Arena Hall 2, this slot is unavailable..."
                  value={customCancelReason}
                  onChange={e => setCustomCancelReason(e.target.value)}
                  disabled={isCancelling}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
                />
              </div>

              {/* Email dispatch notice alert */}
              <div className="flex items-start gap-2.5 p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-800">
                <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Automatic Email Notification</span>
                  <span className="text-blue-700 text-[11px] leading-relaxed">
                    Confirming will cancel this reservation and immediately send a formal cancellation email to{' '}
                    <strong className="font-bold underline">{bookingToCancel.userEmail}</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal actions: OK or Cancel */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setBookingToCancel(null);
                  setCustomCancelReason('');
                }}
                disabled={isCancelling}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-bold cursor-pointer disabled:opacity-40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-red-500/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling & Sending Mail...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>OK, Cancel Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
