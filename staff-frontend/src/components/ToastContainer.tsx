import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();
  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={clsx(
            'flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto animate-fade-in min-w-[280px] max-w-sm',
            toast.type === 'success' && 'toast-success',
            toast.type === 'error' && 'toast-error',
            toast.type === 'info' && 'bg-blue-500/12 border border-blue-500/25 text-blue-200 backdrop-blur-lg',
          )}
        >
          {toast.type === 'success' && <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />}
          {toast.type === 'error' && <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={16} className="text-blue-400 flex-shrink-0" />}
          <p className="text-sm font-semibold flex-1">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="text-current opacity-50 hover:opacity-100 transition-opacity">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
