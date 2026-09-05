import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Search,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import type { ViewType } from '../types';

interface StudentAnnouncementsViewProps {
  onNavigate: (view: ViewType) => void;
}

export const StudentAnnouncementsView: React.FC<StudentAnnouncementsViewProps> = ({
  onNavigate,
}) => {
  const { announcements } = useAdminStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');

  // Show only active announcements to students
  const activeNotices = useMemo(() => {
    return announcements.filter(a => a.isActive);
  }, [announcements]);

  const filteredNotices = useMemo(() => {
    return activeNotices.filter(a => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q);

      const matchesPriority =
        priorityFilter === 'all' || a.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [activeNotices, searchQuery, priorityFilter]);

  const highPriorityCount = activeNotices.filter(a => a.priority === 'High').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={() => onNavigate('dashboard')}
          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold">Campus Announcements</span>
      </nav>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-semibold">
            <Megaphone className="w-3.5 h-3.5 text-blue-200" />
            <span>Campus Sports Board Notices</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Announcements & Updates
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Stay up to date with maintenance schedules, inter-college tournaments, weather advisories, and facility announcements.
          </p>
        </div>

        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
          <Megaphone className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search announcements and notices..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Priority Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto text-xs">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all whitespace-nowrap ${
                priorityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({activeNotices.length})
            </button>
            <button
              onClick={() => setPriorityFilter('High')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all whitespace-nowrap ${
                priorityFilter === 'High'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              High Priority ({highPriorityCount})
            </button>
            <button
              onClick={() => setPriorityFilter('Medium')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all whitespace-nowrap ${
                priorityFilter === 'Medium'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setPriorityFilter('Low')}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-all whitespace-nowrap ${
                priorityFilter === 'Low'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Low
            </button>
          </div>
        </div>

        {(searchQuery || priorityFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing {filteredNotices.length} matching notice{filteredNotices.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Announcements List */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {activeNotices.length === 0
              ? 'No active announcements at the moment'
              : 'No announcements match your search'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeNotices.length === 0
              ? 'Check back later for updates regarding campus sports facilities, events, and maintenance.'
              : 'Try clearing your search query or switching filters to see other announcements.'}
          </p>
          {activeNotices.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              Show All Notices
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map(notice => {
            const isHigh = notice.priority === 'High';
            const isMedium = notice.priority === 'Medium';

            return (
              <div
                key={notice.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-xs hover:shadow-md transition-all space-y-3 ${
                  isHigh
                    ? 'border-red-200/90 hover:border-red-300'
                    : isMedium
                    ? 'border-amber-200/90 hover:border-amber-300'
                    : 'border-slate-200/90 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isHigh
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {notice.priority} Priority
                    </span>

                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {notice.publishDate}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Official Notice
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {notice.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
                    {notice.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
