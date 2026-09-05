import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'danger',
  hideCancel = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 text-amber-600',
          icon: <AlertTriangle className="w-5 h-5" />,
          btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-500/20',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-100 text-blue-600',
          icon: <Info className="w-5 h-5" />,
          btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20',
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 text-rose-600',
          icon: <Trash2 className="w-5 h-5" />,
          btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs shadow-rose-500/20',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click area */}
      <div className="fixed inset-0" onClick={onCancel} />

      {/* Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-md w-full p-5 sm:p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-150 space-y-4"
      >
        {/* Close icon button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 sm:gap-4 pr-6">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${vStyles.iconBg}`}
          >
            {vStyles.icon}
          </div>
          <div className="space-y-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-base sm:text-lg font-black text-slate-900 tracking-tight"
            >
              {title}
            </h3>
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${vStyles.btnConfirm}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
