import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Calendar, Clock, Copy, CheckCheck, User, Hash } from 'lucide-react';
import type { Booking, ViewType } from '../types';
import { SportIconRenderer } from '../components/SportIcons';

interface BookingConfirmedViewProps {
  booking: Booking;
  onNavigate: (view: ViewType) => void;
  onBookAnother: () => void;
}

export const BookingConfirmedView: React.FC<BookingConfirmedViewProps> = ({
  booking,
  onNavigate,
  onBookAnother,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Fire confetti celebration
    const end = Date.now() + 1000;
    const colors = ['#2563EB', '#38BDF8', '#60A5FA', '#1E40AF', '#F59E0B'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const handleCopyId = () => {
    navigator.clipboard.writeText(booking.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6 text-center">
      {/* Animated Checkmark Circle */}
      <div className="relative inline-flex items-center justify-center">
        <div className="absolute -top-3 -left-3 w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        <div className="absolute -top-1 -right-3 w-2.5 h-2.5 rounded-full bg-blue-300" />
        <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 rounded-full bg-blue-500" />
        <div className="absolute -bottom-3 -right-2 w-2 h-2 rounded-full bg-blue-400" />

        <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 ring-8 ring-blue-100">
          <Check className="w-10 h-10 stroke-[3]" />
        </div>
      </div>

      {/* Confirmation Headings */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
          Your slot has been successfully booked. A confirmation email has been dispatched to{' '}
          <span className="font-semibold text-slate-800">{booking.userEmail}</span>
        </p>
      </div>

      {/* Booking Pass / Ticket Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs text-left space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />

        <div className="space-y-3.5 divide-y divide-slate-100">
          {/* Student Name */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Student Name
              </span>
              <span className="text-sm font-bold text-slate-900">
                {booking.userName}
              </span>
            </div>
          </div>

          {/* Registration Number */}
          <div className="flex items-center gap-3 pt-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Hash className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Registration Number
              </span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {booking.registrationNumber}
              </span>
            </div>
          </div>

          {/* Game */}
          <div className="flex items-center gap-3 pt-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <SportIconRenderer
                iconName={booking.activityId}
                size={20}
                className="text-blue-600"
              />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Game
              </span>
              <span className="text-sm font-bold text-slate-900">
                {booking.activityName}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 pt-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Date
              </span>
              <span className="text-sm font-bold text-slate-900">
                {booking.dateString}
              </span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 pt-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Time
              </span>
              <span className="text-sm font-bold text-slate-900">
                {booking.timeSlot}
              </span>
            </div>
          </div>

          {/* Booking ID with Copy */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Booking ID
              </span>
              <span className="text-sm font-mono font-bold text-blue-600">
                {booking.id}
              </span>
            </div>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
              title="Copy Booking ID"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => onNavigate('booking-status')}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>View in My Bookings</span>
        </button>

        <button
          onClick={() => onNavigate('dashboard')}
          className="w-full py-3 px-6 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>

        <button
          onClick={onBookAnother}
          className="w-full py-2.5 px-6 bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-medium text-xs rounded-xl transition-all cursor-pointer"
        >
          Book Another Sport
        </button>
      </div>
    </div>
  );
};
