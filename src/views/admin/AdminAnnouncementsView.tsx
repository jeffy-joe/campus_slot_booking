import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  Search,
  Eye,
  EyeOff,
  BellRing,
  ChevronDown
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import type { Announcement } from '../../types';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { OptionPickerModal } from '../../components/admin/OptionPickerModal';
import type { PickerOption } from '../../components/admin/OptionPickerModal';

const PRIORITY_OPTIONS: PickerOption[] = [
  { value: 'High', label: 'High Priority', description: 'Red banner — shown immediately at top', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-700' },
  { value: 'Medium', label: 'Medium Priority', description: 'Yellow/orange banner — moderate urgency', badge: 'Moderate', badgeColor: 'bg-amber-100 text-amber-700' },
  { value: 'Low', label: 'Low Priority', description: 'Blue informational banner', badge: 'Info', badgeColor: 'bg-blue-100 text-blue-700' },
];

export const AdminAnnouncementsView: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    removeAnnouncement,
    toggleAnnouncementActive,
  } = useAdminStore();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<Announcement['priority']>('High');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Live real-time clock — updates every second, read-only for admin
  const [liveTime, setLiveTime] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatLiveDate = (d: Date): string => {
    const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return `${day}, ${time}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    addAnnouncement({
      title: title.trim(),
      message: message.trim(),
      priority,
      publishDate: formatLiveDate(liveTime),
      isActive: true, // Always published as active immediately
    });

    setNotification(`Announcement "${title.trim()}" published successfully.`);
    setTitle('');
    setMessage('');
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredAnnouncements = announcements.filter(
    a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.priority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Announcements & Notices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Broadcast emergency alerts, facility maintenance notices, or tournament updates to all students.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-xs font-semibold flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5" />
            {announcements.length} Total
          </span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
            {announcements.filter(a => a.isActive).length} Active
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
        {/* LEFT COLUMN: Create Announcement Form matching mockup */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                New Announcement
              </h2>
              <p className="text-[11px] text-slate-400">
                Displays prominently on the student dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Maintenance - Indoor Games"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Message
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Indoor games area will be under maintenance on 31 Aug 2026 from 03:00 PM to 06:00 PM. Kindly plan your bookings accordingly."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Priority
                </label>
                <button
                  type="button"
                  onClick={() => setShowPriorityPicker(true)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    {(() => {
                      const opt = PRIORITY_OPTIONS.find(o => o.value === priority);
                      return (
                        <>
                          <span>{opt?.label ?? priority}</span>
                          {opt?.badge && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${opt.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                              {opt.badge}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
                <OptionPickerModal
                  isOpen={showPriorityPicker}
                  onClose={() => setShowPriorityPicker(false)}
                  title="Select Priority Level"
                  subtitle="Choose how urgently this announcement is displayed."
                  options={PRIORITY_OPTIONS}
                  value={priority}
                  onChange={v => setPriority(v as Announcement['priority'])}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Publish Date & Time
                </label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 flex items-center gap-2 select-none">
                  <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="font-mono tracking-tight">{formatLiveDate(liveTime)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Auto-stamped at publish time</p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs shadow-blue-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Announcement</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Announcements List */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Manage Announcements ({filteredAnnouncements.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Toggle status or delete existing campus announcements.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
              <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No announcements found</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Publish a new announcement to notify students.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnnouncements.map(a => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    a.isActive
                      ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">
                        {a.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          a.priority === 'High'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : a.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {a.priority} Priority
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => toggleAnnouncementActive(a.id)}
                        title={a.isActive ? 'Deactivate Announcement' : 'Activate Announcement'}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                          a.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {a.isActive ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] hidden sm:inline">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[10px] hidden sm:inline">Inactive</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setAnnouncementToDelete(a)}
                        title="Delete Announcement"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs leading-relaxed">
                    {a.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{a.publishDate}</span>
                    </div>
                    <span>ID: {a.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Confirmation Popup Dialog */}
      <ConfirmDialog
        isOpen={!!announcementToDelete}
        title="Delete Announcement"
        message={
          announcementToDelete ? (
            <span>
              Are you sure you want to delete the announcement{' '}
              <strong className="font-bold text-slate-900">"{announcementToDelete.title}"</strong>? This action cannot be undone.
            </span>
          ) : null
        }
        confirmText="OK"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (announcementToDelete) {
            removeAnnouncement(announcementToDelete.id);
            setNotification(`Announcement "${announcementToDelete.title}" deleted.`);
            setAnnouncementToDelete(null);
            setTimeout(() => setNotification(null), 4000);
          }
        }}
        onCancel={() => setAnnouncementToDelete(null)}
      />
    </div>
  );
};
