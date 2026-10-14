import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, onRetry, isRetrying }) => {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 mb-6 text-rose-500 flex items-start justify-between shadow-sm">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">Backend Disconnected</h4>
          <p className="text-xs text-rose-400 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="ml-4 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-xs font-medium text-rose-500 border border-rose-500/30 flex items-center space-x-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      )}
    </div>
  );
};
