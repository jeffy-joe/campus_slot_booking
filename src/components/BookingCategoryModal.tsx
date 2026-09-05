import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight } from 'lucide-react';
import type { ViewType } from '../types';
import { IndoorGamesIcon, TurfGroundsIcon } from './SportIcons';

interface BookingCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (view: ViewType) => void;
}

export const BookingCategoryModal: React.FC<BookingCategoryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  // Lock body scroll when modal is open to prevent background scrolling/shifting
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Full-screen Backdrop with complete viewport coverage */}
      <div
        className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-slate-900/60 backdrop-blur-xs pointer-events-auto transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal / Mobile Bottom-Sheet Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-category-title"
        className="modal-content-panel relative w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100/90 pointer-events-auto flex flex-col max-h-[92dvh] overflow-hidden z-10"
      >
        {/* Mobile Pull Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 sm:pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2
              id="booking-category-title"
              className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
            >
              Book a Slot
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Choose a category to get started
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Category Options Body */}
        <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto">
          {/* Indoor Games Option */}
          <button
            type="button"
            onClick={() => {
              onSelect('indoor-games');
              onClose();
            }}
            className="group w-full flex items-center justify-between gap-4 p-4 sm:p-5 bg-blue-50/60 hover:bg-blue-600 active:bg-blue-700 border border-blue-200/80 hover:border-blue-600 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-left"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                <IndoorGamesIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-white text-sm sm:text-base transition-colors truncate">
                  Indoor Games
                </h3>
                <p className="text-slate-500 group-hover:text-blue-100 text-xs mt-0.5 transition-colors line-clamp-1">
                  Carrom · Table Tennis · Chess · Table Soccer
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>

          {/* Turf & Grounds Option */}
          <button
            type="button"
            onClick={() => {
              onSelect('turf-grounds');
              onClose();
            }}
            className="group w-full flex items-center justify-between gap-4 p-4 sm:p-5 bg-emerald-50/60 hover:bg-emerald-600 active:bg-emerald-700 border border-emerald-200/80 hover:border-emerald-600 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-left"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                <TurfGroundsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-white text-sm sm:text-base transition-colors truncate">
                  Turf & Grounds
                </h3>
                <p className="text-slate-500 group-hover:text-emerald-100 text-xs mt-0.5 transition-colors line-clamp-1">
                  Futsal · Pickle Ball · Cricket Nets · Volleyball
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        </div>

        {/* Footer Note with Mobile Safe-area padding */}
        <div className="px-6 pb-7 sm:pb-6 text-center flex-shrink-0">
          <p className="text-xs text-slate-400">
            All bookings are free · 1-hour sessions · 10:00 AM – 06:00 PM
          </p>
        </div>
      </div>

      <style>{`
        @keyframes sheetSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes modalFadeScale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .modal-content-panel {
          animation: sheetSlideUp 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 640px) {
          .modal-content-panel {
            animation: modalFadeScale 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }
      `}</style>
    </div>
  );

  // Render directly into document.body to break out of all container contexts and mobile clipping
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
