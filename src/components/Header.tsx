import React from 'react';
import { Menu, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import type { User } from '../types';
import { isNeonConfigured } from '../lib/neon';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  activeDateString?: string;
  currentUser?: User | null;
  onOpenLogin?: () => void;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  currentUser,
  onOpenLogin,
  onSignOut,
}) => {
  const isDbLive = isNeonConfigured();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* User Header Actions & DB Status */}
      <div className="flex items-center gap-2.5">
        {isDbLive ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold" title="Neon Database Connected">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>DB Connected (Neon)</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold" title="Running in local cache. Add DATABASE_URL to Vercel Environment Variables.">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Local Mode (DB Disconnected)</span>
          </div>
        )}
        {currentUser ? (
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200/80 rounded-full pl-2 sm:pl-3 pr-2 py-1 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                {currentUser.isGuest ? (
                  <UserIcon className="w-3.5 h-3.5" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 max-w-[120px] sm:max-w-[160px] truncate hidden sm:inline">
                {currentUser.name}
              </span>
              {currentUser.isGuest && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">
                  Guest
                </span>
              )}
            </div>

            {onSignOut && (
              <button
                onClick={onSignOut}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          onOpenLogin && (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Sign In</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
