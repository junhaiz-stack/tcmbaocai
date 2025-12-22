import React from 'react';

interface MobileDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  // alert: 只有“我知道了”；confirm: 取消 + 确认
  mode?: 'alert' | 'confirm';
}

export const MobileDialog: React.FC<MobileDialogProps> = ({
  open,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  mode = 'alert',
}) => {
  if (!open) return null;

  const handleCancel = () => {
    onCancel?.();
  };

  const handleConfirm = () => {
    onConfirm?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* 背景蒙层 */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* 底部弹窗主体 */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 pb-4 animate-in slide-in-from-bottom duration-200">
        {title && (
          <h3 className="text-base font-black text-slate-900 text-center mb-2">
            {title}
          </h3>
        )}
        <p className="text-sm text-slate-600 text-center mb-4 whitespace-pre-line">
          {message}
        </p>

        {mode === 'alert' ? (
          <button
            onClick={handleCancel}
            className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-95 transition-transform shadow-md shadow-emerald-100"
          >
            {confirmText}
          </button>
        ) : (
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm active:scale-95 transition-transform"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-95 transition-transform shadow-md shadow-emerald-100"
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};





