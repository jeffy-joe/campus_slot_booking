import React, { useState } from 'react';
import type { Booking, AdminTab } from '../../types';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminBookingsView } from './AdminBookingsView';
import { AdminRestrictSlotsView } from './AdminRestrictSlotsView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { useAdminStore } from '../../store/adminStore';
import { X, Megaphone, Plus, ChevronDown } from 'lucide-react';
import { OptionPickerModal } from '../../components/admin/OptionPickerModal';
import type { PickerOption } from '../../components/admin/OptionPickerModal';

const PRIORITY_OPTIONS: PickerOption[] = [
  { value: 'High', label: 'High Priority', description: 'Red banner — shown immediately at top', badge: 'Urgent', badgeColor: 'bg-red-100 text-red-700' },
  { value: 'Medium', label: 'Medium Priority', description: 'Yellow/orange banner — moderate urgency', badge: 'Moderate', badgeColor: 'bg-amber-100 text-amber-700' },
  { value: 'Low', label: 'Low Priority', description: 'Blue informational banner', badge: 'Info', badgeColor: 'bg-blue-100 text-blue-700' },
];

interface AdminPortalViewProps {
  onExitAdmin: () => void;
  bookings: Booking[];
  onCancelBooking?: (
    bookingId: string,
    reason?: string,
    emailStatus?: 'sent' | 'failed' | 'simulated',
    emailError?: string
  ) => void;
}

const ADMIN_TAB_STORAGE_KEY = 'campus_sports_admin_active_tab_v2';
const VALID_ADMIN_TABS: AdminTab[] = ['dashboard', 'bookings', 'restrict-slots', 'announcements'];

function resolveInitialAdminTab(): AdminTab {
  if (typeof window !== 'undefined' && window.location.hash) {
    const raw = window.location.hash.replace(/^#\/?/, '').trim();
    if (raw.startsWith('admin/')) {
      const sub = raw.replace('admin/', '') as AdminTab;
      if (VALID_ADMIN_TABS.includes(sub)) return sub;
    } else if (VALID_ADMIN_TABS.includes(raw as AdminTab)) {
      return raw as AdminTab;
    }
  }

  try {
    const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY) as AdminTab;
    if (saved && VALID_ADMIN_TABS.includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error('Failed to restore admin tab', e);
  }

  return 'dashboard';
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  onExitAdmin,
  bookings,
  onCancelBooking,
}) => {
  const [activeTab, setActiveTabState] = useState<AdminTab>(resolveInitialAdminTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
      if (typeof window !== 'undefined') {
        window.location.hash = `admin/${tab}`;
      }
    } catch (e) {
      console.error('Failed to save admin tab', e);
    }
  };

  // Sync hash and storage on activeTab change and browser navigation
  React.useEffect(() => {
    try {
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, activeTab);
      if (typeof window !== 'undefined') {
        const expectedHash = `admin/${activeTab}`;
        if (window.location.hash.replace(/^#\/?/, '') !== expectedHash) {
          window.location.hash = expectedHash;
        }
      }
    } catch (e) {
      console.error('Failed to sync admin tab', e);
    }
  }, [activeTab]);

  React.useEffect(() => {
    const handleHash = () => {
      const raw = window.location.hash.replace(/^#\/?/, '').trim();
      if (raw.startsWith('admin/')) {
        const sub = raw.replace('admin/', '') as AdminTab;
        if (VALID_ADMIN_TABS.includes(sub)) {
          setActiveTabState(sub);
        }
      }
    };

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Quick modals triggered from overview
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalPriority, setModalPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [showModalPriorityPicker, setShowModalPriorityPicker] = useState(false);

  const { addAnnouncement } = useAdminStore();

  const handleQuickAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim() || !modalMessage.trim()) return;

    const now = new Date();
    const day = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    addAnnouncement({
      title: modalTitle.trim(),
      message: modalMessage.trim(),
      priority: modalPriority,
      publishDate: `${day}, ${time}`,
      isActive: true,
    });

    setModalTitle('');
    setModalMessage('');
    setShowAnnouncementModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex">
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={tab => {
          setActiveTab(tab);
          setMobileSidebarOpen(false);
        }}
        onExitAdmin={onExitAdmin}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 w-full">
        <AdminHeader
          activeTab={activeTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(prev => !prev)}
          onExitAdmin={onExitAdmin}
        />

        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <AdminDashboardOverview
              bookings={bookings}
              onNavigateTab={tab => setActiveTab(tab)}
              onOpenCreateAnnouncement={() => setShowAnnouncementModal(true)}
              onOpenRestrictModal={() => setActiveTab('restrict-slots')}
            />
          )}

          {activeTab === 'bookings' && (
            <AdminBookingsView
              bookings={bookings}
              onCancelBooking={onCancelBooking}
            />
          )}

          {activeTab === 'restrict-slots' && (
            <AdminRestrictSlotsView
              bookings={bookings}
              onCancelBooking={onCancelBooking}
            />
          )}

          {activeTab === 'announcements' && (
            <AdminAnnouncementsView />
          )}
        </main>
      </div>

      {/* Quick Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-6 space-y-4 relative">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Announcement
                </h3>
                <p className="text-xs text-slate-400">
                  Publish a new alert to all students.
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickAnnouncementSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Badminton Court Maintenance"
                  value={modalTitle}
                  onChange={e => setModalTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide notice details for students..."
                  value={modalMessage}
                  onChange={e => setModalMessage(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Priority
                </label>
                <button
                  type="button"
                  onClick={() => setShowModalPriorityPicker(true)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-between gap-2 cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    {(() => {
                      const opt = PRIORITY_OPTIONS.find(o => o.value === modalPriority);
                      return (
                        <>
                          <span>{opt?.label ?? modalPriority}</span>
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
                  isOpen={showModalPriorityPicker}
                  onClose={() => setShowModalPriorityPicker(false)}
                  title="Select Priority Level"
                  subtitle="Choose how urgently this announcement is displayed."
                  options={PRIORITY_OPTIONS}
                  value={modalPriority}
                  onChange={v => setModalPriority(v as 'High' | 'Medium' | 'Low')}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
