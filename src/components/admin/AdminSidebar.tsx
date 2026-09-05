import React from 'react';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Ban, 
  Megaphone, 
  LogOut,
  X 
} from 'lucide-react';
import { LogoIcon } from '../SportIcons';
import type { AdminTab } from '../../types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onExitAdmin: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  onExitAdmin,
}) => {
  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <CalendarCheck className="w-5 h-5" />,
    },
    {
      id: 'restrict-slots',
      label: 'Restrict Slots',
      icon: <Ban className="w-5 h-5" />,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Megaphone className="w-5 h-5" />,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
        <button
          onClick={() => {
            onSelectTab('dashboard');
            onCloseMobile();
          }}
          className="flex items-center gap-3 text-left group transition-transform active:scale-95 cursor-pointer"
        >
          <LogoIcon className="w-8 h-8 flex-shrink-0 drop-shadow-xs" />
          <div className="leading-tight">
            <span className="block font-bold text-slate-900 text-sm tracking-tight">
              Campus
            </span>
            <span className="block font-medium text-slate-500 text-xs">
              Sports Booking
            </span>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Close admin menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin Tag Badge */}
      <div className="px-6 pt-4 pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Admin Portal
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-3 space-y-1">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-slate-500'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom: Logout / Exit */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onExitAdmin}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50/70 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-64">
        {content}
      </aside>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};
