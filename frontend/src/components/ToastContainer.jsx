import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = () => {
  const { toasts } = useNotifications();

  if (toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-rose-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'INFO':
      default:
        return <Info className="h-5 w-5 text-sky-500" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'SUCCESS':
        return 'border-emerald-500 bg-emerald-50/95 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
      case 'ERROR':
        return 'border-rose-500 bg-rose-50/95 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
      case 'WARNING':
        return 'border-amber-500 bg-amber-50/95 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
      case 'INFO':
      default:
        return 'border-sky-500 bg-sky-50/95 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-slide-in ${getColor(
            toast.type
          )}`}
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 text-sm font-medium leading-tight">{toast.message}</div>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
