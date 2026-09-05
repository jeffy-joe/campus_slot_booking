import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Check } from 'lucide-react';

export interface PickerOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  badge?: string;
  badgeColor?: string;
}

interface OptionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: PickerOption[];
  value: string;
  onChange: (value: string) => void;
}

export const OptionPickerModal: React.FC<OptionPickerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  options,
  value,
  onChange,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Group options by their 'group' field
  const groupOrder: string[] = [];
  const groupedMap: Record<string, PickerOption[]> = {};
  for (const opt of options) {
    const gk = opt.group ?? '__no_group__';
    if (!groupedMap[gk]) {
      groupedMap[gk] = [];
      groupOrder.push(gk);
    }
    groupedMap[gk].push(opt);
  }

  const handleSelect = (opt: PickerOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    onClose();
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col"
        style={{ maxHeight: '80vh', animation: 'optionPickerIn 0.18s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-900 leading-tight">{title}</h2>
            {subtitle && (
              <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close picker"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Options */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1">
          {groupOrder.map(gk => {
            const items = groupedMap[gk];
            const displayGroupName = gk === '__no_group__' ? null : gk;
            return (
              <div key={gk}>
                {displayGroupName && (
                  <div className="px-2 pt-2 pb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {displayGroupName}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  {items.map(opt => {
                    const isSelected = opt.value === value;
                    const isDisabled = !!opt.disabled;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleSelect(opt)}
                        className={[
                          'w-full text-left px-3 py-2.5 rounded-xl border transition-all flex items-center gap-3',
                          isSelected
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                            : isDisabled
                            ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-50'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'w-1 self-stretch rounded-full flex-shrink-0 transition-all',
                            isSelected ? 'bg-blue-500' : 'bg-transparent',
                          ].join(' ')}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={[
                                'text-xs font-bold',
                                isSelected
                                  ? 'text-blue-700'
                                  : isDisabled
                                  ? 'text-slate-400'
                                  : 'text-slate-800',
                              ].join(' ')}
                            >
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span
                                className={[
                                  'px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                                  opt.badgeColor || 'bg-slate-100 text-slate-600',
                                ].join(' ')}
                              >
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.description && (
                            <p
                              className={[
                                'text-[11px] mt-0.5 leading-relaxed',
                                isDisabled ? 'text-slate-400' : 'text-slate-500',
                              ].join(' ')}
                            >
                              {opt.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes optionPickerIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};
