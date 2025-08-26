import { memo } from 'react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export const ErrorDisplay = memo<ErrorDisplayProps>(({ error, onRetry, showRetry = true }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-center">
      <div className="flex items-center justify-center mb-2">
        <span className="text-2xl mr-2">❌</span>
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
      </div>
      <p className="text-red-700 mb-3">{error}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Try Again
        </button>
      )}
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';



