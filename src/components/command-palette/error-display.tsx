import React, { useRef, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from "lucide-react";
import type { CommandPaletteError } from "@/types/command-palette";
import { commandPaletteErrorHandler } from "@/lib/command-palette/error-handler";

interface ErrorDisplayProps {
  error: CommandPaletteError;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRecoverySuggestions?: boolean;
  className?: string;
}

/**
 * Error Display Component
 * Shows user-friendly error messages with optional retry and recovery suggestions
 */
export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  showRecoverySuggestions = true,
  className = ""
}: ErrorDisplayProps) {
  const alertRef = useRef<HTMLDivElement>(null);
  const userFriendlyMessage = commandPaletteErrorHandler.getUserFriendlyMessage(error);
  const recoverySuggestions = commandPaletteErrorHandler.getRecoverySuggestions(error);
  const canRetry = commandPaletteErrorHandler.shouldRetry(error);

  // Focus the alert when it appears for screen reader announcement
  useEffect(() => {
    if (alertRef.current) {
      alertRef.current.focus();
    }
  }, [error]);

  return (
    <Alert 
      ref={alertRef}
      variant="destructive" 
      className={`relative ${className}`}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-destructive/20"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}

      <div className="space-y-2">
        <AlertTitle className="text-sm font-medium">
          {userFriendlyMessage}
        </AlertTitle>
        
        {error.details && (
          <AlertDescription className="text-xs opacity-90">
            {error.details}
          </AlertDescription>
        )}

        {/* Recovery suggestions */}
        {showRecoverySuggestions && recoverySuggestions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-2">Try these solutions:</p>
            <ul 
              className="text-xs space-y-1 list-disc list-inside opacity-90"
              role="list"
            >
              {recoverySuggestions.map((suggestion, index) => (
                <li key={index} role="listitem">{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          {canRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-7 px-3 text-xs bg-background hover:bg-accent"
              aria-label="Retry the failed operation"
            >
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

/**
 * Inline Error Display Component
 * Compact error display for inline use
 */
export function InlineErrorDisplay({ 
  error, 
  onRetry, 
  className = ""
}: Pick<ErrorDisplayProps, 'error' | 'onRetry' | 'className'>) {
  const userFriendlyMessage = commandPaletteErrorHandler.getUserFriendlyMessage(error);
  const canRetry = commandPaletteErrorHandler.shouldRetry(error);

  return (
    <div 
      className={`flex items-center gap-2 text-sm text-destructive ${className}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="flex-1 min-w-0 truncate">{userFriendlyMessage}</span>
      {canRetry && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          className="h-6 w-6 p-0 hover:bg-destructive/10"
          aria-label="Retry"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}