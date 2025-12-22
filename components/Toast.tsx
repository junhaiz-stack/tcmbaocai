import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

export const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-orange-50 border-orange-200 text-orange-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] px-6 py-4 rounded-2xl border-2 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in duration-300 ${colors[toast.type]}`}
      style={{ maxWidth: 'calc(100vw - 64px)' }}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span className="font-black text-sm">{toast.message}</span>
      </div>
    </div>
  );
};

