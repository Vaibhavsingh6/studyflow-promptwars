import React from 'react';
import { CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';

interface StatusAlertProps {
  type: 'error' | 'success' | 'info' | 'loading';
  title?: string;
  message: string;
  onDismiss?: () => void;
}

export const StatusAlert: React.FC<StatusAlertProps> = ({
  type,
  title,
  message,
  onDismiss,
}) => {
  const styles = {
    error: {
      container: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />,
      titleColor: 'text-rose-900',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />,
      titleColor: 'text-emerald-900',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />,
      titleColor: 'text-blue-900',
    },
    loading: {
      container: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      icon: <Loader2 className="h-5 w-5 text-indigo-600 animate-spin flex-shrink-0" />,
      titleColor: 'text-indigo-900',
    },
  }[type];

  return (
    <div
      role="alert"
      className={`border rounded-lg p-4 transition-all duration-150 ${styles.container}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {styles.icon}
          <div>
            {title && <h4 className={`text-sm font-semibold ${styles.titleColor}`}>{title}</h4>}
            <p className="text-sm mt-0.5 whitespace-pre-line">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium ml-3 cursor-pointer"
            aria-label="Dismiss alert"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
};
