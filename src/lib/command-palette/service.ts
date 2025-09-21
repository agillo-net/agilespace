import { toast } from "sonner";
import { checkRepositoryAccess, searchIssues } from "@/lib/github/queries";
import type { GitHubIssue, Track } from "@/types";
import type { 
  CommandPaletteError,
  RepositoryAccessResult,
  SessionOperationResult,
  TrackOperationResult,
  CommandPaletteService,
  SpaceData
} from "@/types/command-palette";

/**
 * Command Palette Service Implementation
 * Handles all business logic for command palette operations
 */
export class CommandPaletteServiceImpl implements CommandPaletteService {
  /**
   * Check if user has access to a repository
   */
  async checkRepositoryAccess(owner: string, repo: string): Promise<RepositoryAccessResult> {
    try {
      const hasAccess = await checkRepositoryAccess(owner, repo);
      return { hasAccess };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { 
        hasAccess: false, 
        error: errorMessage 
      };
    }
  }

  /**
   * Start a session for an existing track
   */
  async startSession(trackId: string): Promise<SessionOperationResult> {
    try {
      // This would be implemented with the actual session start logic
      // For now, returning a placeholder
      return {
        success: true,
        sessionId: trackId // placeholder
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start session';
      return {
        success: false,
        error: {
          type: 'SESSION_START_FAILED',
          message: errorMessage
        }
      };
    }
  }

  /**
   * Create a new track and start a session
   */
  async createTrackAndStartSession(issue: GitHubIssue): Promise<TrackOperationResult> {
    try {
      if (!issue.repository.owner || !issue.repository.name) {
        return {
          success: false,
          error: {
            type: 'TRACK_CREATION_FAILED',
            message: 'Repository information is missing'
          }
        };
      }

      // Check repository access first
      const accessResult = await this.checkRepositoryAccess(
        issue.repository.owner, 
        issue.repository.name
      );

      if (!accessResult.hasAccess) {
        return {
          success: false,
          error: {
            type: 'REPOSITORY_ACCESS_DENIED',
            message: 'You do not have access to this repository',
            details: accessResult.error
          }
        };
      }

      // This would be implemented with the actual track creation logic
      // For now, returning a placeholder
      return {
        success: true,
        trackId: `track-${issue.id}` // placeholder
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create track';
      return {
        success: false,
        error: {
          type: 'TRACK_CREATION_FAILED',
          message: errorMessage
        }
      };
    }
  }

  /**
   * Search for GitHub issues
   */
  async searchIssues(slug: string, query: string): Promise<GitHubIssue[]> {
    try {
      return await searchIssues(slug, query);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      throw new Error(errorMessage);
    }
  }
}

/**
 * Utility functions for command palette operations
 */
export class CommandPaletteUtils {
  /**
   * Find a track that matches a GitHub issue
   */
  static getTrackForIssue(issue: GitHubIssue, spaceData?: SpaceData): Track | null {
    if (!spaceData?.tracks) return null;
    
    return spaceData.tracks.find(
      (track) =>
        track.repo_owner === issue.repository.owner &&
        track.repo_name === issue.repository.name &&
        track.issue_number === issue.number
    ) || null;
  }

  /**
   * Check if a track is currently active in a session
   */
  static isCurrentSessionTrack(trackId: string, activeSessionTrackId?: string): boolean {
    return activeSessionTrackId === trackId;
  }

  /**
   * Validate GitHub issue data
   */
  static validateGitHubIssue(issue: GitHubIssue): boolean {
    return !!(
      issue.id &&
      issue.title &&
      issue.repository?.owner &&
      issue.repository?.name &&
      issue.number
    );
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(error: CommandPaletteError): string {
    switch (error.type) {
      case 'REPOSITORY_ACCESS_DENIED':
        return 'You do not have access to this repository. Please check your permissions.';
      case 'SEARCH_FAILED':
        return 'Failed to search issues. Please try again.';
      case 'SESSION_START_FAILED':
        return 'Failed to start session. Please try again.';
      case 'TRACK_CREATION_FAILED':
        return 'Failed to create track. Please try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Show error toast notification
   */
  static showErrorToast(error: CommandPaletteError): void {
    const message = this.formatErrorMessage(error);
    toast.error(message);
  }

  /**
   * Show success toast notification
   */
  static showSuccessToast(message: string): void {
    toast.success(message);
  }
}

/**
 * Keyboard shortcut utilities
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, () => void> = new Map();
  private isSetup: boolean = false;
  private cleanupFunction: (() => void) | null = null;

  /**
   * Register a keyboard shortcut
   */
  register(key: string, callback: () => void): void {
    this.shortcuts.set(key, callback);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown = (event: KeyboardEvent): void => {
    const { key, metaKey, ctrlKey } = event;
    
    // Command palette shortcut (Cmd/Ctrl + K)
    if (key === 'k' && (metaKey || ctrlKey)) {
      event.preventDefault();
      const callback = this.shortcuts.get('toggle-palette');
      if (callback) {
        callback();
      }
    }
  };

  /**
   * Setup keyboard event listeners (prevents duplicate listeners)
   */
  setup(): () => void {
    // If already setup, return existing cleanup function
    if (this.isSetup && this.cleanupFunction) {
      return this.cleanupFunction;
    }

    // Clean up any existing listeners first
    this.cleanup();

    // Add the event listener
    document.addEventListener('keydown', this.handleKeyDown);
    this.isSetup = true;
    
    // Create cleanup function
    this.cleanupFunction = () => {
      this.cleanup();
    };
    
    return this.cleanupFunction;
  }

  /**
   * Clean up event listeners
   */
  private cleanup(): void {
    if (this.isSetup) {
      document.removeEventListener('keydown', this.handleKeyDown);
      this.isSetup = false;
      this.cleanupFunction = null;
    }
  }

  /**
   * Force cleanup (for testing or manual cleanup)
   */
  public forceCleanup(): void {
    this.cleanup();
    this.shortcuts.clear();
  }
}

// Export singleton instances
export const commandPaletteService = new CommandPaletteServiceImpl();
export const commandPaletteUtils = CommandPaletteUtils;
export const keyboardShortcutManager = new KeyboardShortcutManager();