// Reusable error state with optional retry button

import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <AlertCircle size={32} className="text-red-400" />
      <p className="text-sm text-red-400 text-center max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-emerald-500 hover:text-emerald-400 underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}