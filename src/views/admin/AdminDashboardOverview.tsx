import React, { useMemo, useState, useEffect } from 'react';
import {
  Calendar,
  Ban,
  Megaphone,
  TrendingUp,
  FileText
} from 'lucide-react';
import type { Booking, AdminTab } from '../../types';
import { useAdminStore } from '../../store/adminStore';

interface AdminDashboardOverviewProps {
  bookings: Booking[];
  onNavigateTab: (tab: AdminTab) => void;
  onOpenCreateAnnouncement: () => void;
  onOpenRestrictModal?: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  bookings,
  onNavigateTab,
  onOpenCreateAnnouncement,
  onOpenRestrictModal,
}) => {
  const { restrictions, announcements, activeAnnouncements } = useAdminStore();

  const getLocalDateKey = (): string => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [todayKey, setTodayKey] = useState<string>(getLocalDateKey);

  useEffect(() => {
    const timer = setInterval(() => {
      setTodayKey(getLocalDateKey());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter bookings for today only
  const todayBookings = useMemo(() => {
    return bookings.filter(b => b.dateKey === todayKey);
  }, [bookings, todayKey]);

  const todayBookingsCount = todayBookings.length;

  const todayConfirmedBookingsCount = useMemo(() => {
    return todayBookings.filter(b => b.status === 'confirmed').length;
  }, [todayBookings]);

  // Filter restrictions active on today's date
  const activeTodayRestrictionsCount = useMemo(() => {
    return restrictions.filter(r => r.dateKey === todayKey).length;
  }, [restrictions, todayKey]);

  // Filter and sort upcoming restrictions
  const upcomingRestrictions = useMemo(() => {
    return [...restrictions].slice(0, 5);
  }, [restrictions]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-7 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Manage BookMyslot bookings, restrictions and announcements.
        </p>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Today's Bookings */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 sm:space-y-2">
          <div className="flex items-center sm:block gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="sm:hidden min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">
                Today's Bookings
              </span>
              <span className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>{todayConfirmedBookingsCount} confirmed</span>
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight flex-shrink-0">
            {todayBookingsCount}
          </span>
          <span className="hidden sm:block text-xs sm:text-sm font-semibold text-slate-400">
            Today's Bookings
          </span>
          <span className="hidden sm:inline-flex text-xs font-bold text-emerald-600 items-center gap-1 pt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{todayConfirmedBookingsCount} confirmed</span>
          </span>
        </div>

        {/* Card 2: Today's Restricted Slots */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 sm:space-y-2">
          <div className="flex items-center sm:block gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
              <Ban className="w-5 h-5" />
            </div>
            <div className="sm:hidden min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">
                Today's Restrictions
              </span>
              <span className="text-[11px] font-bold text-amber-600 block">
                {activeTodayRestrictionsCount === 0 ? 'All facilities open' : `${activeTodayRestrictionsCount} active today`}
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight flex-shrink-0">
            {activeTodayRestrictionsCount}
          </span>
          <span className="hidden sm:block text-xs sm:text-sm font-semibold text-slate-400">
            Today's Restrictions
          </span>
          <span className="hidden sm:block text-xs font-bold text-amber-600 pt-1">
            {activeTodayRestrictionsCount === 0 ? 'All facilities open' : `${activeTodayRestrictionsCount} active today`}
          </span>
        </div>

        {/* Card 3: Announcements */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/90 shadow-2xs flex sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-3 sm:space-y-2">
          <div className="flex items-center sm:block gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div className="sm:hidden min-w-0">
              <span className="text-xs font-bold text-slate-700 block truncate">
                Total Announcements
              </span>
              <span className="text-[11px] font-bold text-blue-600 block">
                {activeAnnouncements.length} active now
              </span>
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight flex-shrink-0">
            {announcements.length}
          </span>
          <span className="hidden sm:block text-xs sm:text-sm font-semibold text-slate-400">
            Total Announcements
          </span>
          <span className="hidden sm:block text-xs font-bold text-blue-600 pt-1">
            {activeAnnouncements.length} active now
          </span>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Action 1: View Bookings */}
          <button
            onClick={() => onNavigateTab('bookings')}
            className="p-4 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 block">
                View Bookings
              </span>
              <p className="text-xs text-slate-400 mt-0.5">See all booking details</p>
            </div>
          </button>

          {/* Action 2: Restrict Slots */}
          <button
            onClick={onOpenRestrictModal || (() => onNavigateTab('restrict-slots'))}
            className="p-4 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-rose-600 block">
                Restrict Slots
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Block dates or time slots</p>
            </div>
          </button>

          {/* Action 3: New Announcement */}
          <button
            onClick={onOpenCreateAnnouncement}
            className="p-4 bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs flex items-start gap-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 group-hover:text-sky-600 block">
                New Announcement
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Send updates to students</p>
            </div>
          </button>
        </div>
      </div>

      {/* Upcoming Restricted Slots Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Upcoming Restricted Slots
          </h2>
          <button
            onClick={() => onNavigateTab('restrict-slots')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            View All
          </button>
        </div>

        {upcomingRestrictions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No upcoming restricted slots. All facilities are open.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingRestrictions.map(r => (
              <div
                key={r.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                      {r.dateString}
                    </span>
                    <span className="text-[11px] sm:text-xs text-slate-500 mt-0.5 block">
                      {r.activityName && r.activityName !== 'All Games'
                        ? `${r.activityName} (${r.facilityName})`
                        : r.facilityName} · {r.timeSlot}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    r.reason === 'Maintenance'
                      ? 'bg-amber-100 text-amber-800'
                      : r.reason === 'Event'
                      ? 'bg-purple-100 text-purple-800'
                      : r.reason === 'Holiday'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {r.reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
