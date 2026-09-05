import React, { useState } from 'react';
import { ArrowRight, Info, AlertCircle, Clock } from 'lucide-react';
import { HeroIllustration } from '../components/HeroIllustration';

import { SportIconRenderer, IndoorGamesIcon, TurfGroundsIcon } from '../components/SportIcons';
import { BookingCategoryModal } from '../components/BookingCategoryModal';
import type { SportActivity, ViewType } from '../types';
import { ACTIVITIES } from '../data/sportsData';
import { useAdminStore } from '../store/adminStore';

interface DashboardViewProps {
  onNavigate: (view: ViewType) => void;
  onSelectSport: (sport: SportActivity) => void;
  onCheckBooking: (bookingId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectSport,
  onCheckBooking,
}) => {
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { activeAnnouncements } = useAdminStore();
  const popularActivities = ACTIVITIES.filter(a => a.popular);

  const handleCheckStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingIdInput.trim()) {
      setErrorMsg('Please enter a valid Booking ID');
      return;
    }
    setErrorMsg('');
    onCheckBooking(bookingIdInput.trim());
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Active Campus Announcements Banner / Feed on Dashboard */}
      {activeAnnouncements.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Campus Announcements ({activeAnnouncements.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All Notices</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {activeAnnouncements.slice(0, 2).map(notice => {
              const isHigh = notice.priority === 'High';
              const isMedium = notice.priority === 'Medium';

              return (
                <div
                  key={notice.id}
                  onClick={() => onNavigate('announcements')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white hover:shadow-md space-y-2 relative overflow-hidden ${
                    isHigh
                      ? 'border-red-200/90 hover:border-red-300 bg-gradient-to-br from-white to-red-50/20'
                      : isMedium
                      ? 'border-amber-200/90 hover:border-amber-300 bg-gradient-to-br from-white to-amber-50/20'
                      : 'border-slate-200/90 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isHigh
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : isMedium
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {notice.priority}
                    </span>

                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notice.publishDate}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {notice.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40 border border-blue-100/80 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-xl text-center md:text-left space-y-4">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Book Your Campus <br className="hidden sm:inline" />
              Sports Slot
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Find an available slot for indoor games and outdoor grounds. Reserve your favorite arena in seconds with instant confirmation.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm sm:text-base rounded-xl shadow-md shadow-blue-500/25 transition-all hover:translate-x-0.5 cursor-pointer"
              >
                <span>Book a Slot</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Hero Sports Vector Art */}
          <div className="flex-shrink-0">
            <HeroIllustration className="w-64 h-48 sm:w-72 sm:h-52" />
          </div>
        </div>
      </section>

      {/* Quick Booking Cards (2 Columns) */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Quick Booking
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Indoor Games */}
          <div
            onClick={() => onNavigate('indoor-games')}
            className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <IndoorGamesIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-0.5">
                  Indoor Games
                </h3>
                <p className="text-slate-500 text-xs">
                  Book your favorite indoor games
                </p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Turf & Grounds */}
          <div
            onClick={() => onNavigate('turf-grounds')}
            className="group bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <TurfGroundsIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-0.5">
                  Turf & Grounds
                </h3>
                <p className="text-slate-500 text-xs">
                  Book turfs and outdoor grounds
                </p>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Activities */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Popular Activities
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {popularActivities.map(activity => (
            <button
              key={activity.id}
              onClick={() => onSelectSport(activity)}
              className="group bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center text-center gap-2.5 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-blue-50 flex items-center justify-center text-blue-600 transition-colors">
                <SportIconRenderer iconName={activity.iconName} size={24} className="text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate w-full">
                {activity.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* How Booking Works (3 Steps) */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          How Booking Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                Choose Activity
              </h3>
              <p className="text-xs text-slate-500">
                Select a game or ground from our list of available sports.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                Select Slot
              </h3>
              <p className="text-xs text-slate-500">
                Pick your preferred date and time slot from the schedule.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-0.5">
                Confirm Booking
              </h3>
              <p className="text-xs text-slate-500">
                Enter your Gmail and get instant confirmation with your Booking ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Info Cards: Check Status & Important Notice */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Already made a booking */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Already made a booking?
            </h3>
            <p className="text-slate-500 text-xs">
              Enter your Booking ID to view your booking details or cancel.
            </p>
          </div>

          <form onSubmit={handleCheckStatusSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingIdInput}
                onChange={e => {
                  setBookingIdInput(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter Booking ID (e.g. TT3108260100)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-colors uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              >
                Check Status
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}
          </form>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50/60 rounded-2xl p-6 border border-blue-100 space-y-3">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
            <Info className="w-4 h-4 text-blue-600" />
            <span>Important Notice</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Please arrive on time for your booked slot.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>A slot can only be booked by one person/group.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Cancellation policies apply (up to 1 hour before slot).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Your Gmail is used only to send booking related notifications.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Category Selection Modal */}
      <BookingCategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(view) => {
          onNavigate(view);
          setModalOpen(false);
        }}
      />
    </div>
  );
};
