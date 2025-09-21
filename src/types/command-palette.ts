import type { GitHubIssue, Space, Track, Tag, SpaceMember } from "./index";

/**
 * Space data structure returned by getSpaceAndTracks
 */
export interface SpaceData {
  space: Space | null;
  tracks: Track[];
  space_member: SpaceMember | null;
  tags: Tag[];
}

/**
 * Command palette state management types
 */
export interface CommandPaletteState {
  isOpen: boolean;
  searchQuery: string;
  debouncedSearchQuery: string;
  isSearching: boolean;
  error: CommandPaletteError | null;
}

/**
 * Command palette actions for state management
 */
export interface CommandPaletteActions {
  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  setError: (error: CommandPaletteError | null) => void;
}

/**
 * Error types for command palette operations
 */
export interface CommandPaletteError {
  type: 'REPOSITORY_ACCESS_DENIED' | 'SEARCH_FAILED' | 'SESSION_START_FAILED' | 'TRACK_CREATION_FAILED';
  message: string;
  details?: string;
}

/**
 * Command palette item types
 */
export type CommandPaletteItemType = 'existing-track' | 'new-track' | 'action';

export interface BaseCommandPaletteItem {
  id: string;
  type: CommandPaletteItemType;
  title: string;
  subtitle?: string;
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ExistingTrackItem extends BaseCommandPaletteItem {
  type: 'existing-track';
  trackId: string;
  issue: GitHubIssue;
  sessionCount: number;
  totalDuration: string;
  isActive: boolean;
}

export interface NewTrackItem extends BaseCommandPaletteItem {
  type: 'new-track';
  issue: GitHubIssue;
}

export interface ActionItem extends BaseCommandPaletteItem {
  type: 'action';
  action: () => void | Promise<void>;
}

export type CommandPaletteItem = ExistingTrackItem | NewTrackItem | ActionItem;

/**
 * Command palette configuration
 */
export interface CommandPaletteConfig {
  debounceTime: number;
  maxResults: number;
  enableKeyboardShortcuts: boolean;
  showSessionStats: boolean;
}

/**
 * Repository access check result
 */
export interface RepositoryAccessResult {
  hasAccess: boolean;
  error?: string;
}

/**
 * Session operation results
 */
export interface SessionOperationResult {
  success: boolean;
  error?: CommandPaletteError;
  sessionId?: string;
}

/**
 * Track operation results
 */
export interface TrackOperationResult {
  success: boolean;
  error?: CommandPaletteError;
  trackId?: string;
}

/**
 * Command palette business logic interface
 */
export interface CommandPaletteService {
  checkRepositoryAccess: (owner: string, repo: string) => Promise<RepositoryAccessResult>;
  startSession: (trackId: string) => Promise<SessionOperationResult>;
  createTrackAndStartSession: (issue: GitHubIssue) => Promise<TrackOperationResult>;
  searchIssues: (slug: string, query: string) => Promise<GitHubIssue[]>;
}

/**
 * Command palette hook return type
 */
export interface UseCommandPaletteReturn {
  // State
  state: CommandPaletteState;
  
  // Actions
  actions: CommandPaletteActions;
  
  // Data
  items: CommandPaletteItem[];
  spaceData: SpaceData | undefined;
  
  // Operations
  handleItemSelect: (item: CommandPaletteItem) => Promise<void>;
  retrySearch: () => void;
  
  // Utilities
  getTrackForIssue: (issue: GitHubIssue) => Track | null;
  isCurrentSessionTrack: (trackId: string) => boolean;
}

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}