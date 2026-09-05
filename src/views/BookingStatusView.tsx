import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  User, 
  Hash, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  Send,
  Copy,
  CheckCheck,
  CalendarCheck,
  ArrowRight
} from 'lucide-react';
import type { Booking, ViewType, User as UserType, SportActivity } from '../types';
import { SportIconRenderer } from '../components/SportIcons';
import { BookingCategoryModal } from '../components/BookingCategoryModal';
import { ACTIVITIES, isBookingEnded } from '../data/sportsData';
import { ConfirmDialog } from '../components/admin/ConfirmDialog';

interface BookingStatusViewProps {
  initialSearchId?: string;
  currentUser?: UserType | null;
  userBookings?: Booking[];
  onNavigate: (view: ViewType) => void;
  getBookingById: (id: string) => Booking | undefined;
  cancelBooking: (id: string) => boolean;
  onUpdateEmailStatus?: (
    id: string,
    status: 'sent' | 'failed' | 'simulated',
    error?: string,
    email?: string,
    sender?: string
  ) => void;
  onSelectSport?: (sport: SportActivity) => void;
}

export const BookingStatusView: React.FC<BookingStatusViewProps> = ({
  initialSearchId = '',
  currentUser,
  userBookings = [],
  onNavigate,
  getBookingById,
  cancelBooking,
  onUpdateEmailStatus,
  onSelectSport,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchId);
  const [searchedBooking, setSearchedBooking] = useState<Booking | null>(() => {
    if (initialSearchId) {
      return getBookingById(initialSearchId) || null;
    }
    return null;
  });
  const [notFound, setNotFound] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [notification, setNotification] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [activeEmailEditorId, setActiveEmailEditorId] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookingIdToCancel, setBookingIdToCancel] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  // Periodically update clock so ended slots transition out automatically
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter out ended slots from My Reservations (past days or today after slot end time)
  const activeUserBookings = userBookings.filter(b => !isBookingEnded(b, currentTime));

  // Filter bookings for the logged-in user by tab
  const filteredUserBookings = activeUserBookings.filter(booking => {
    if (filterTab === 'confirmed') return booking.status === 'confirmed';
    if (filterTab === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const confirmedCount = activeUserBookings.filter(b => b.status === 'confirmed').length;
  const cancelledCount = activeUserBookings.filter(b => b.status === 'cancelled').length;

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchTerm.trim().toUpperCase();
    if (!clean) {
      setSearchedBooking(null);
      setNotFound(false);
      return;
    }

    const match = getBookingById(clean);
    if (match) {
      setSearchedBooking(match);
      setCustomEmail(match.userEmail);
      setNotFound(false);
    } else {
      setSearchedBooking(null);
      setNotFound(true);
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    setBookingIdToCancel(bookingId);
  };

  const handleSendEmailReceipt = async (targetBooking: Booking, overrideEmail?: string) => {
    const emailToUse = (overrideEmail || customEmail || targetBooking.userEmail).trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setNotification({
        type: 'error',
        message: 'Please provide a valid email address.',
      });
      return;
    }

    setSendingId(targetBooking.id);
    setNotification(null);

    try {
      const res = await fetch('/api/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: targetBooking.id,
          userName: targetBooking.userName,
          registrationNumber: targetBooking.registrationNumber,
          userEmail: emailToUse,
          activityName: targetBooking.activityName,
          dateString: targetBooking.dateString,
          timeSlot: targetBooking.timeSlot,
          venue: targetBooking.venue,
        }),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        result = { success: false, error: 'Failed to parse response' };
      }

      if (result && result.success) {
        const mode = result.mode === 'smtp_ethereal' ? 'simulated' : 'sent';
        setNotification({
          type: 'success',
          message: `Receipt successfully sent via SMTP to ${emailToUse}! If not in inbox, please check your Spam/Junk folder.`,
        });
        setActiveEmailEditorId(null);
        if (onUpdateEmailStatus) {
          onUpdateEmailStatus(targetBooking.id, mode, undefined, emailToUse, result.sender);
        }
        if (searchedBooking?.id === targetBooking.id) {
          setSearchedBooking(prev => prev ? {
            ...prev,
            userEmail: emailToUse,
            emailDeliveryStatus: mode,
            emailError: undefined,
            emailSender: result.sender,
          } : null);
        }
      } else {
        const errMsg = result?.error || 'Failed to dispatch email via SMTP';
        setNotification({
          type: 'error',
          message: `Email sending failed: ${errMsg}`,
        });
        if (onUpdateEmailStatus) {
          onUpdateEmailStatus(targetBooking.id, 'failed', errMsg, emailToUse);
        }
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: `Network error connecting to SMTP server: ${err?.message || 'Unknown error'}`,
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleBookAgain = (activityId: string) => {
    const sport = ACTIVITIES.find(a => a.id === activityId);
    if (sport && onSelectSport) {
      onSelectSport(sport);
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Bookings & Status
            </h1>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            {currentUser && !currentUser.isGuest ? (
              <span>
                Showing reservations for <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.email})
              </span>
            ) : (
              <span>View active reservations, email booking passes, or look up booking IDs</span>
            )}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book New Slot</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="leading-relaxed">{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-1 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Lookup Bar & Status Filter */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search by Booking ID */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setNotFound(false);
                if (!e.target.value.trim()) {
                  setSearchedBooking(null);
                }
              }}
              placeholder="Search by Booking ID (e.g. TT3108260100)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm uppercase tracking-wider text-slate-900 placeholder-slate-400 placeholder:normal-case focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all min-h-[42px]"
            />
          </div>
          <button
            type="submit"
            className="px-4 sm:px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap min-h-[42px]"
          >
            Find
          </button>
        </form>

        {/* Filter Pills for User's Bookings (only for logged-in students, hidden in guest mode) */}
        {currentUser && !currentUser.isGuest && activeUserBookings.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 self-stretch sm:self-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeUserBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('confirmed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'confirmed'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'cancelled'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cancelled ({cancelledCount})
            </button>
          </div>
        )}
      </div>

      {/* Searched Booking Highlight Modal/Card (if user searched an ID) */}
      {searchedBooking && (
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 rounded-3xl border-2 border-blue-400 p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100/70 px-2.5 py-1 rounded-md">
                Search Result
              </span>
              <h2 className="text-base sm:text-lg font-mono font-bold text-slate-900">
                #{searchedBooking.id}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchedBooking(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                  searchedBooking.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {searchedBooking.status}
              </span>
            </div>
          </div>

          {searchedBooking.status === 'cancelled' && (
            <div className="p-3.5 bg-red-50/90 border border-red-200/80 rounded-xl text-xs text-red-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>
                  Slot Cancelled {searchedBooking.cancelledBy === 'admin' ? 'by Campus Administration' : ''}
                </span>
              </div>
              {searchedBooking.cancellationReason && (
                <p className="text-[11px] text-red-700 font-medium">
                  <strong>Reason:</strong> {searchedBooking.cancellationReason}
                </p>
              )}
              <p className="text-[10px] text-slate-500">
                Official cancellation email notification was dispatched to {searchedBooking.userEmail}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-600 flex-shrink-0">
                <SportIconRenderer iconName={searchedBooking.activityId} size={20} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Sport</span>
                <span className="text-sm font-bold text-slate-800">{searchedBooking.activityName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Date</span>
                <span className="text-sm font-bold text-slate-800">{searchedBooking.dateString}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Time Slot</span>
                <span className="text-sm font-bold text-slate-800">{searchedBooking.timeSlot}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-blue-100 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-900">{searchedBooking.userName}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono font-semibold text-slate-800">{searchedBooking.registrationNumber}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Email: <span className="font-semibold text-slate-800">{searchedBooking.userEmail}</span></span>
              </span>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                disabled={sendingId === searchedBooking.id}
                onClick={() => handleSendEmailReceipt(searchedBooking)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${sendingId === searchedBooking.id ? 'animate-spin' : ''}`} />
                <span>{sendingId === searchedBooking.id ? 'Sending...' : 'Email Receipt'}</span>
              </button>

              {searchedBooking.status === 'confirmed' && (
                <button
                  onClick={() => handleCancelBooking(searchedBooking.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Result: Not Found */}
      {notFound && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            No booking found matching ID
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We could not find any active booking matching reference "<span className="font-mono font-semibold">{searchTerm}</span>". Please double-check the booking ID.
          </p>
        </div>
      )}

      {/* Logged-in User Bookings List */}
      {currentUser && !currentUser.isGuest ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>My Reserved Slots</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {filteredUserBookings.length}
              </span>
            </h2>

            {activeUserBookings.length > 0 && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                Click any slot to manage or resend entry receipt
              </span>
            )}
          </div>

          {filteredUserBookings.length > 0 ? (
            <div className="space-y-3.5">
              {filteredUserBookings.map(booking => {
                const isConfirmed = booking.status === 'confirmed';
                const isSending = sendingId === booking.id;
                const isEditingEmail = activeEmailEditorId === booking.id;
                const isCopied = copiedId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all p-4 sm:p-6 space-y-4 relative overflow-hidden"
                  >
                    {/* Status Top Strip */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isConfirmed ? 'bg-emerald-500' : 'bg-rose-400'
                    }`} />

                    {/* Top Row: Activity & Reference & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-xs">
                          <SportIconRenderer iconName={booking.activityId} size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                              {booking.activityName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">
                              {booking.category === 'indoor' ? 'Indoor' : 'Turf'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badge & Reference ID */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5">
                        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                          <span className="font-mono text-xs font-bold text-blue-600">
                            #{booking.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(booking.id)}
                            className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 cursor-pointer"
                            title="Copy Booking ID"
                          >
                            {isCopied ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isConfirmed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span>{booking.status}</span>
                        </span>
                      </div>
                    </div>

                    {!isConfirmed && (
                      <div className="p-3 bg-red-50/90 border border-red-200/80 rounded-xl text-xs text-red-900 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span>
                            Slot Cancelled {booking.cancelledBy === 'admin' ? 'by Campus Administration' : ''}
                          </span>
                        </div>
                        {booking.cancellationReason && (
                          <p className="text-[11px] text-red-700 font-medium">
                            <strong>Reason:</strong> {booking.cancellationReason}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500">
                          Cancellation email notification was dispatched to {booking.userEmail}.
                        </p>
                      </div>
                    )}

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50/70 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Scheduled Date</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800">{booking.dateString}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Time Slot</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-800">{booking.timeSlot}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-blue-600 flex-shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email Pass</span>
                          <span className="text-xs font-semibold text-slate-800 truncate block">
                            {booking.userEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{booking.userName}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">{booking.registrationNumber}</span>
                        {booking.emailDeliveryStatus === 'sent' && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Pass Emailed
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Email / Resend Receipt */}
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => {
                            if (isEditingEmail) {
                              handleSendEmailReceipt(booking, customEmail);
                            } else {
                              setCustomEmail(booking.userEmail);
                              setActiveEmailEditorId(booking.id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                          <span>{isSending ? 'Sending...' : 'Email Receipt'}</span>
                        </button>

                        {/* Re-book / Book Again */}
                        <button
                          type="button"
                          onClick={() => handleBookAgain(booking.activityId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Book Again</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Booking */}
                        {isConfirmed && (
                          <button
                            type="button"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Email Address Dispatcher */}
                    {isEditingEmail && (
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs animate-in fade-in duration-150">
                        <span className="text-slate-700 font-semibold whitespace-nowrap">
                          Dispatch to Email:
                        </span>
                        <input
                          type="email"
                          value={customEmail}
                          onChange={e => setCustomEmail(e.target.value)}
                          placeholder="Enter recipient email"
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 min-h-[36px]"
                        />
                        <button
                          type="button"
                          disabled={isSending}
                          onClick={() => handleSendEmailReceipt(booking, customEmail)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Receipt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEmailEditorId(null)}
                          className="px-3 py-2 text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State for user bookings */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <CalendarCheck className="w-8 h-8 text-blue-600" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  {filterTab === 'all' ? 'No Active Bookings' : `No ${filterTab} bookings`}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  {filterTab === 'all'
                    ? "You currently have no active or upcoming reservations. Ended sessions are automatically hidden. Pick an arena below to reserve your next slot!"
                    : `You have no ${filterTab} active bookings.`}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Reserve a Slot Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Guest Mode Notice */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Browsing as Guest
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Log in to an account to automatically view and track all your campus reservations in one place. You can also search any booking ID using the lookup box above.
              </p>
            </div>
          </div>
          <div className="pt-1 flex gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Log In to My Account
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Pop-up modal asking Indoor Games or Turf & Grounds */}
      <BookingCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={onNavigate}
      />

      {/* Pop-up message box asking OK or Cancel for booking cancellation */}
      <ConfirmDialog
        isOpen={!!bookingIdToCancel}
        title="Cancel Reservation"
        message={
          bookingIdToCancel ? (
            <span>
              Are you sure you want to cancel your slot reservation{' '}
              <strong className="font-bold text-slate-900">#{bookingIdToCancel}</strong>? This action will release the slot for other students.
            </span>
          ) : null
        }
        confirmText="OK"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (bookingIdToCancel) {
            const id = bookingIdToCancel;
            setBookingIdToCancel(null);
            const success = cancelBooking(id);
            if (success) {
              setNotification({
                type: 'info',
                message: `Booking #${id} has been successfully cancelled.`,
              });
              const updated = getBookingById(id);
              if (updated && searchedBooking?.id === id) {
                setSearchedBooking(updated);
              }
              setTimeout(() => setNotification(null), 5000);
            }
          }
        }}
        onCancel={() => setBookingIdToCancel(null)}
      />
    </div>
  );
};
