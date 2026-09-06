import React from 'react';
import { Home, CheckSquare, X, LogOut, LogIn, User as UserIcon, Megaphone } from 'lucide-react';
import type { ViewType, User } from '../types';
import { LogoIcon, IndoorGamesIcon, TurfGroundsIcon } from './SportIcons';
import { useAdminStore } from '../store/adminStore';

interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: User | null;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  currentUser,
  onSignOut,
}) => {
  const { activeAnnouncements } = useAdminStore();

  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Dashboard',
      icon: Home,
      views: ['dashboard'],
    },
    {
      id: 'indoor-games' as ViewType,
      label: 'Indoor Games',
      icon: IndoorGamesIcon,
      views: ['indoor-games'],
    },
    {
      id: 'turf-grounds' as ViewType,
      label: 'Turf & Grounds',
      icon: TurfGroundsIcon,
      views: ['turf-grounds'],
    },
    {
      id: 'booking-status' as ViewType,
      label: 'Booking Status',
      icon: CheckSquare,
      views: ['booking-status'],
    },
    {
      id: 'announcements' as ViewType,
      label: 'Announcements',
      icon: Megaphone,
      views: ['announcements'],
      badge: activeAnnouncements.length > 0 ? activeAnnouncements.length : undefined,
    },
  ];

  // Helper to determine active state
  const isItemActive = (itemViews: string[]) => {
    if (itemViews.includes(currentView)) return true;
    if (
      (currentView === 'slot-selection' || currentView === 'confirm-booking') &&
      itemViews.includes('indoor-games')
    ) {
      return false;
    }
    return false;
  };

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Brand / Logo */}
      <div className="flex items-center justify-between px-6 py-6 border-b border-slate-100">
        <button 
          onClick={() => { onNavigate('dashboard'); onCloseMobile(); }}
          className="flex items-center gap-3 text-left group transition-transform active:scale-95 cursor-pointer"
        >
          <LogoIcon className="w-8 h-8 flex-shrink-0 drop-shadow-sm" />
          <div className="leading-tight">
            <span className="block font-black text-slate-900 text-base tracking-tight">
              Book<span className="text-blue-600">Myslot</span>
            </span>
          </div>
        </button>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation list */}
      <nav className="p-4 space-y-1.5 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isItemActive(item.views) || currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 text-left cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    active
                      ? 'bg-white/25 text-white'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile or Login CTA */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        {currentUser ? (
          <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {currentUser.isGuest ? (
                  <UserIcon className="w-4 h-4" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </span>
                <span className="block text-[11px] text-slate-400 truncate">
                  {currentUser.isGuest
                    ? 'Guest Mode'
                    : currentUser.registrationNumber || currentUser.email}
                </span>
              </div>
            </div>

            {onSignOut && (
              <button
                onClick={() => {
                  onSignOut();
                  onCloseMobile();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              onNavigate('login');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In / Sign Up</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-30 w-64 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
        {content}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile drawer */}
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
