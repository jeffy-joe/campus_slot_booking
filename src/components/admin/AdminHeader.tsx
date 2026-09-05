import React from 'react';
import { Menu, ShieldCheck, LogOut } from 'lucide-react';
import type { AdminTab } from '../../types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onOpenMobileMenu: () => void;
  onExitAdmin: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab,
  onOpenMobileMenu,
  onExitAdmin,
}) => {
  const getTabTitle = (tab: AdminTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Admin Dashboard';
      case 'bookings':
        return 'Manage Bookings';
      case 'restrict-slots':
        return 'Restrict Slots';
      case 'announcements':
        return 'Announcements';
      default:
        return 'Admin';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer flex-shrink-0"
          aria-label="Open admin navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="hidden xs:inline">Admin</span>
            <span className="hidden xs:inline">/</span>
            <span className="text-blue-600 truncate">{getTabTitle(activeTab)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Mobile Sign Out Icon Button */}
        <button
          onClick={onExitAdmin}
          className="sm:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Desktop / Tablet Sign Out Button */}
        <button
          onClick={onExitAdmin}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100/80 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        {/* Admin Profile Pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-blue-500/30 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="leading-tight text-left hidden sm:block">
            <span className="block text-sm font-bold text-slate-900">
              Admin
            </span>
            <span className="block text-[11px] font-medium text-slate-400">
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
