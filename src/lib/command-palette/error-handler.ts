import type { CommandPaletteError } from "@/types/command-palette";

/**
 * Error Handler for Command Palette
 * Provides centralized error handling, logging, and user-friendly error messages
 */
export class CommandPaletteErrorHandler {
  private static instance: CommandPaletteErrorHandler;

  public static getInstance(): CommandPaletteErrorHandler {
    if (!CommandPaletteErrorHandler.instance) {
      CommandPaletteErrorHandler.instance = new CommandPaletteErrorHandler();
    }
    return CommandPaletteErrorHandler.instance;
  }

  /**
   * Handle and categorize errors from various command palette operations
   */
  public handleError(error: unknown, context: string): CommandPaletteError {
    console.error(`[CommandPalette] Error in ${context}:`, error);

    // Network/API errors
    if (this.isNetworkError(error)) {
      return this.createNetworkError(error, context);
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return this.createAuthError(error, context);
    }

    // Repository access errors
    if (this.isRepositoryAccessError(error)) {
      return this.createRepositoryAccessError(error, context);
    }

    // Rate limiting errors
    if (this.isRateLimitError(error)) {
      return this.createRateLimitError(error, context);
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return this.createValidationError(error, context);
    }

    // Generic error fallback
    return this.createGenericError(error, context);
  }

  /**
   * Create user-friendly error messages based on error type
   */
  public getUserFriendlyMessage(error: CommandPaletteError): string {
    switch (error.type) {
      case 'REPOSITORY_ACCESS_DENIED':
        return 'You don\'t have access to this repository. Please check your permissions.';
      
      case 'SEARCH_FAILED':
        return 'Failed to search issues. Please try again or check your connection.';
      
      case 'SESSION_START_FAILED':
        return 'Could not start the session. Please try again.';
      
      case 'TRACK_CREATION_FAILED':
        return 'Failed to create track. Please try again.';
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Get recovery suggestions for different error types
   */
  public getRecoverySuggestions(error: CommandPaletteError): string[] {
    switch (error.type) {
      case 'REPOSITORY_ACCESS_DENIED':
        return [
          'Check if you have the correct repository permissions',
          'Verify your GitHub authentication',
          'Contact the repository owner for access'
        ];
      
      case 'SEARCH_FAILED':
        return [
          'Check your internet connection',
          'Try a different search query',
          'Wait a moment and try again'
        ];
      
      case 'SESSION_START_FAILED':
        return [
          'End any active sessions first',
          'Check if the track still exists',
          'Refresh the page and try again'
        ];
      
      case 'TRACK_CREATION_FAILED':
        return [
          'Verify the issue still exists',
          'Check your repository permissions',
          'Try again in a few moments'
        ];
      
      default:
        return [
          'Refresh the page',
          'Check your internet connection',
          'Try again later'
        ];
    }
  }

  /**
   * Check if error should trigger a retry mechanism
   */
  public shouldRetry(error: CommandPaletteError): boolean {
    const retryableTypes = ['SEARCH_FAILED'];
    return retryableTypes.includes(error.type);
  }

  /**
   * Get retry delay in milliseconds
   */
  public getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  }

  // Private helper methods for error detection
  private isNetworkError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.name === 'NetworkError'
    );
  }

  private isAuthError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('401') ||
      error.message.includes('unauthorized') ||
      error.message.includes('authentication')
    );
  }

  private isRepositoryAccessError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('403') ||
      error.message.includes('forbidden') ||
      error.message.includes('access denied')
    );
  }

  private isRateLimitError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('429') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many requests')
    );
  }

  private isValidationError(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('400') ||
      error.message.includes('validation') ||
      error.message.includes('invalid')
    );
  }

  // Private helper methods for error creation
  private createNetworkError(error: unknown, context: string): CommandPaletteError {
    return {
      type: 'SEARCH_FAILED',
      message: 'Network connection failed',
      details: `Failed to connect while ${context}. Please check your internet connection.`
    };
  }

  private createAuthError(error: unknown, context: string): CommandPaletteError {
    return {
      type: 'REPOSITORY_ACCESS_DENIED',
      message: 'Authentication required',
      details: `Authentication failed while ${context}. Please sign in again.`
    };
  }

  private createRepositoryAccessError(error: unknown, context: string): CommandPaletteError {
    return {
      type: 'REPOSITORY_ACCESS_DENIED',
      message: 'Access denied',
      details: `You don't have permission to access this repository while ${context}.`
    };
  }

  private createRateLimitError(error: unknown, context: string): CommandPaletteError {
    return {
      type: 'SEARCH_FAILED',
      message: 'Rate limit exceeded',
      details: `Too many requests while ${context}. Please wait a moment before trying again.`
    };
  }

  private createValidationError(error: unknown, context: string): CommandPaletteError {
    return {
      type: 'SEARCH_FAILED',
      message: 'Invalid request',
      details: `Invalid data provided while ${context}. Please check your input.`
    };
  }

  private createGenericError(error: unknown, context: string): CommandPaletteError {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      type: 'SEARCH_FAILED',
      message: 'Something went wrong',
      details: `An unexpected error occurred while ${context}: ${message}`
    };
  }
}

// Export singleton instance
export const commandPaletteErrorHandler = CommandPaletteErrorHandler.getInstance();