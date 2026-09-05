import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowRight, ArrowLeft, Search, CheckCircle2, ShieldAlert, Building2 } from 'lucide-react';
import type { ActivityCategory, SportActivity } from '../../types';
import { IndoorGamesIcon, TurfGroundsIcon, SportIconRenderer } from '../SportIcons';
import { ACTIVITIES } from '../../data/sportsData';

interface AdminFacilityGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFacility: 'all' | 'indoor' | 'turf';
  currentGameId: 'all' | string;
  onSelect: (selection: {
    facility: 'all' | 'indoor' | 'turf';
    gameId: 'all' | string;
  }) => void;
}

export const AdminFacilityGameModal: React.FC<AdminFacilityGameModalProps> = ({
  isOpen,
  onClose,
  currentFacility,
  currentGameId,
  onSelect,
}) => {
  // Modal step: 'category' (Step 1) -> 'game' (Step 2)
  const [step, setStep] = useState<'category' | 'game'>('category');
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // When modal opens, initialize step based on current selections
  useEffect(() => {
    if (isOpen) {
      if (currentGameId !== 'all') {
        const act = ACTIVITIES.find(a => a.id === currentGameId);
        if (act) {
          setSelectedCategory(act.category);
          setStep('game');
        } else {
          setStep('category');
        }
      } else if (currentFacility === 'indoor' || currentFacility === 'turf') {
        setSelectedCategory(currentFacility);
        setStep('category');
      } else {
        setStep('category');
      }
      setSearchQuery('');
    }
  }, [isOpen, currentFacility, currentGameId]);

  // Lock body scroll when open
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

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter games for step 2 based on chosen category and search query
  const availableGames = useMemo(() => {
    if (!selectedCategory) return [];
    return ACTIVITIES.filter(a => {
      if (a.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.defaultVenue.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCategoryChoose = (category: ActivityCategory) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setStep('game');
  };

  const handleSelectAllFacility = (category: ActivityCategory) => {
    onSelect({
      facility: category,
      gameId: 'all',
    });
    onClose();
  };

  const handleSelectCampusWide = () => {
    onSelect({
      facility: 'all',
      gameId: 'all',
    });
    onClose();
  };

  const handleSelectGame = (game: SportActivity) => {
    onSelect({
      facility: game.category,
      gameId: game.id,
    });
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      {/* Full-screen Backdrop */}
      <div
        className="fixed inset-0 w-full h-full min-h-screen min-h-[100dvh] bg-slate-900/60 backdrop-blur-xs pointer-events-auto transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="facility-modal-title"
        className="modal-content-panel relative w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl border-t sm:border border-slate-100/90 pointer-events-auto flex flex-col max-h-[92dvh] overflow-hidden z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center flex-shrink-0">
          <div className="w-12 h-1.5 bg-slate-300/80 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-3 sm:pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {step === 'game' && (
              <button
                type="button"
                onClick={() => setStep('category')}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer mr-1"
                aria-label="Back to categories"
                title="Back to facility selection"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200/60">
                  Step {step === 'category' ? '1 of 2' : '2 of 2'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {step === 'category' ? 'Select Facility' : 'Select Game / Sport'}
                </span>
              </div>
              <h2
                id="facility-modal-title"
                className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5"
              >
                {step === 'category' ? 'Where to restrict slots?' : `Which ${selectedCategory === 'indoor' ? 'Indoor Game' : 'Turf Game'}?`}
              </h2>
            </div>
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

        {/* STEP 1: FACILITY CATEGORY SELECTION */}
        {step === 'category' && (
          <div className="p-5 sm:p-6 space-y-3.5 overflow-y-auto">
            <p className="text-xs text-slate-500 pb-1">
              Choose the facility category first, then pick the individual game or restrict the whole venue:
            </p>

            {/* Indoor Games Option */}
            <button
              type="button"
              onClick={() => handleCategoryChoose('indoor')}
              className={`group w-full flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-left border ${
                currentFacility === 'indoor' && currentGameId === 'all'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-blue-50/50 hover:bg-blue-600 active:bg-blue-700 border-blue-200/80 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                  <IndoorGamesIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-white text-sm sm:text-base transition-colors truncate">
                      Indoor Games
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 group-hover:bg-white/25 text-blue-700 group-hover:text-white transition-colors">
                      4 Sports
                    </span>
                  </div>
                  <p className="text-slate-500 group-hover:text-blue-100 text-xs mt-0.5 transition-colors line-clamp-1">
                    Carrom · Table Tennis · Chess · Table Soccer
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* Turf & Grounds Option - Uniform Blue Theme */}
            <button
              type="button"
              onClick={() => handleCategoryChoose('turf')}
              className={`group w-full flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-left border ${
                currentFacility === 'turf' && currentGameId === 'all'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-blue-50/50 hover:bg-blue-600 active:bg-blue-700 border-blue-200/80 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                  <TurfGroundsIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-white text-sm sm:text-base transition-colors truncate">
                      Turf & Grounds
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 group-hover:bg-white/25 text-blue-700 group-hover:text-white transition-colors">
                      4 Sports
                    </span>
                  </div>
                  <p className="text-slate-500 group-hover:text-blue-100 text-xs mt-0.5 transition-colors line-clamp-1">
                    Futsal · Pickle Ball · Cricket Nets · Volleyball
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>

            {/* Divider */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 font-medium">Or block entire campus</span>
              </div>
            </div>

            {/* Campus-Wide Option - Uniform Blue Theme */}
            <button
              type="button"
              onClick={handleSelectCampusWide}
              className={`group w-full flex items-center justify-between gap-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-left border ${
                currentFacility === 'all' && currentGameId === 'all'
                  ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                  : 'bg-blue-50/50 hover:bg-blue-600 active:bg-blue-700 border-blue-200/80 hover:border-blue-600'
              }`}
            >
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-600 group-hover:bg-white/20 flex items-center justify-center text-white transition-colors flex-shrink-0 shadow-xs">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 group-hover:text-white text-sm sm:text-base transition-colors truncate">
                    All Facilities (Campus Wide)
                  </h3>
                  <p className="text-slate-500 group-hover:text-blue-100 text-xs mt-0.5 transition-colors">
                    Restricts every indoor and outdoor sport simultaneously
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-500 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </button>
          </div>
        )}

        {/* STEP 2: GAME SELECTION */}
        {step === 'game' && selectedCategory && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search Bar */}
            <div className="p-4 sm:px-6 border-b border-slate-100 bg-white space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${selectedCategory === 'indoor' ? 'Indoor Games' : 'Turf Sports'}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Game Cards matching student SportCard style */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[50dvh] space-y-2.5">
              {/* Option to restrict ALL games in this category */}
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSelectAllFacility(selectedCategory)}
                  className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    currentFacility === selectedCategory && currentGameId === 'all'
                      ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        All {selectedCategory === 'indoor' ? 'Indoor Games' : 'Turf & Grounds'}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Block all 4 sports in this section at once
                      </p>
                    </div>
                  </div>
                  {currentFacility === selectedCategory && currentGameId === 'all' ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <span className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0">
                      Select All
                    </span>
                  )}
                </button>
              )}

              {/* Individual Sport Cards */}
              {availableGames.map(game => {
                const isSelected = currentGameId === game.id;

                return (
                  <div
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left cursor-pointer transition-all group ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/90 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Sport Icon Container with consistent blue theme */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 bg-blue-50 border border-blue-100 text-blue-600"
                      >
                        <SportIconRenderer
                          iconName={game.iconName}
                          size={26}
                          className="text-blue-600"
                        />
                      </div>

                      {/* Sport details */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors truncate">
                          {game.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {game.description}
                        </p>
                      </div>
                    </div>

                    {/* Checkmark or Selection Arrow */}
                    <div className="flex-shrink-0 pl-2">
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {availableGames.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-slate-600">
                    No games found matching "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Try another search term or click clear.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-shrink-0">
          <span>
            {step === 'category'
              ? 'Select category to inspect games'
              : `Showing ${availableGames.length} sport(s)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer transition-colors"
          >
            Cancel
          </button>
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
