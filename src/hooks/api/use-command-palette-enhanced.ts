import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/use-debounce";
import { DEBOUNCE_TIME } from "@/constants";
import { getSpaceAndTracks } from "@/lib/supabase/queries";
import { useSessions } from "@/hooks/api/use-sessions";
import { useCommandPaletteContext } from "@/lib/command-palette/context";
import { 
  commandPaletteService, 
  commandPaletteUtils,
  keyboardShortcutManager 
} from "@/lib/command-palette/service";
import { commandPaletteErrorHandler } from "@/lib/command-palette/error-handler";
import type { 
  UseCommandPaletteReturn, 
  CommandPaletteItem,
  ExistingTrackItem,
  NewTrackItem
} from "@/types/command-palette";
import type { GitHubIssue } from "@/types";
import { Github, Plus } from "lucide-react";

/**
 * Enhanced Command Palette Hook
 * Uses service layer and context for better separation of concerns
 */
export function useCommandPaletteEnhanced(): UseCommandPaletteReturn {
  const { slug } = useParams({ from: "/space/$slug" });
  const { state, actions } = useCommandPaletteContext();
  const sessionsHook = useSessions(slug);
  
  // Debounce search query
  const [debouncedSearchQuery] = useDebounce(state.searchQuery, DEBOUNCE_TIME);

  // Get space data for tracks
  const { data: spaceData } = useQuery({
    queryKey: ["space", slug],
    queryFn: () => getSpaceAndTracks(slug),
    enabled: !!slug,
  });

  // Search GitHub issues
  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
    refetch,
  } = useQuery({
    queryKey: ["sessions", "issues", slug, debouncedSearchQuery],
    queryFn: () => commandPaletteService.searchIssues(slug, debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim() && !!slug,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  // Handle search error
  React.useEffect(() => {
    if (searchError) {
      actions.setError({
        type: 'SEARCH_FAILED',
        message: searchError instanceof Error ? searchError.message : 'Search failed'
      });
    } else {
      actions.setError(null);
    }
  }, [searchError, actions]);

  // Setup keyboard shortcuts
  React.useEffect(() => {
    // Create a stable reference to the toggle function
    const togglePalette = () => actions.togglePalette();
    
    keyboardShortcutManager.register('toggle-palette', togglePalette);
    const cleanup = keyboardShortcutManager.setup();
    
    return () => {
      cleanup();
      keyboardShortcutManager.unregister('toggle-palette');
    };
  }, []); // Empty dependency array since actions are memoized

  // Reset search query when dialog closes and refetch when dialog opens
  React.useEffect(() => {
    if (!state.isOpen) {
      actions.clearSearch();
    } else if (debouncedSearchQuery.trim()) {
      refetch();
    }
  }, [state.isOpen, debouncedSearchQuery, refetch, actions]);



  // Memoize session-related values for better performance
  const sessionData = React.useMemo(() => ({
    hasActiveSession: sessionsHook.activeSession !== null,
    activeTrackId: sessionsHook.activeSession?.track.id,
    isStartSessionPending: sessionsHook.startSessionMutation.isPending,
    isCreateTrackPending: sessionsHook.createTrackAndStartSessionMutation.isPending,
  }), [
    sessionsHook.activeSession,
    sessionsHook.startSessionMutation.isPending,
    sessionsHook.createTrackAndStartSessionMutation.isPending
  ]);

  // Generate command palette items from search results
  const items = React.useMemo<CommandPaletteItem[]>(() => {
    if (!searchResults || !debouncedSearchQuery.trim()) {
      return [];
    }

    return searchResults.map((issue): CommandPaletteItem => {
      const existingTrack = commandPaletteUtils.getTrackForIssue(issue, spaceData);
      
      if (existingTrack) {
        const isActive = commandPaletteUtils.isCurrentSessionTrack(
          existingTrack.id, 
          sessionData.activeTrackId
        );
        const sessionCount = sessionsHook.getSessionCount(existingTrack.id);
        const totalDuration = sessionsHook.getTotalDuration(existingTrack.id);

        return {
          id: `existing-${issue.id}`,
          type: 'existing-track',
          title: issue.title,
          subtitle: `${issue.repository.owner}/${issue.repository.name}#${issue.number}`,
          disabled: sessionData.hasActiveSession && !sessionData.isStartSessionPending,
          icon: Github,
          trackId: existingTrack.id,
          issue,
          sessionCount,
          totalDuration,
          isActive,
        } as ExistingTrackItem;
      } else {
        return {
          id: `new-${issue.id}`,
          type: 'new-track',
          title: issue.title,
          subtitle: `${issue.repository.owner}/${issue.repository.name}#${issue.number}`,
          disabled: sessionData.hasActiveSession && !sessionData.isCreateTrackPending,
          icon: Plus,
          issue,
        } as NewTrackItem;
      }
    });
  }, [searchResults, debouncedSearchQuery, spaceData, sessionData, sessionsHook]);

  // Handle item selection with comprehensive error handling
  const handleItemSelect = React.useCallback(async (item: CommandPaletteItem): Promise<void> => {
    try {
      // Clear any existing errors
      actions.setError(null);

      if (item.type === 'existing-track') {
        const result = await commandPaletteService.startSession(item.trackId);
        if (!result.success && result.error) {
          actions.setError(result.error);
        }
      } else if (item.type === 'new-track') {
        const result = await commandPaletteService.createTrackAndStartSession(item.issue);
        if (!result.success && result.error) {
          actions.setError(result.error);
        }
      } else if (item.type === 'action') {
        await item.action();
      }
    } catch (error) {
      const commandPaletteError = commandPaletteErrorHandler.handleError(
        error, 
        `selecting ${item.type} item: ${item.title}`
      );
      actions.setError(commandPaletteError);
    }
  }, [actions]);

  // Retry search functionality
  const retrySearch = React.useCallback(() => {
    if (debouncedSearchQuery && spaceData?.space?.slug) {
      // Clear error and retry the search
      actions.setError(null);
      // The query will automatically refetch due to the dependency change
    }
  }, [debouncedSearchQuery, spaceData?.space?.slug, actions]);

  // Utility functions
  const getTrackForIssue = React.useCallback((issue: GitHubIssue) => {
    return commandPaletteUtils.getTrackForIssue(issue, spaceData);
  }, [spaceData]);

  const isCurrentSessionTrack = React.useCallback((trackId: string) => {
    return commandPaletteUtils.isCurrentSessionTrack(
      trackId, 
      sessionsHook.activeSession?.track.id
    );
  }, [sessionsHook.activeSession?.track.id]);

  return {
    state: {
      ...state,
      debouncedSearchQuery,
      isSearching: isSearching || false,
    },
    actions,
    items,
    spaceData,
    handleItemSelect,
    getTrackForIssue,
    isCurrentSessionTrack,
    retrySearch,
  };
}