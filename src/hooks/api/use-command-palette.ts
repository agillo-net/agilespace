import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/use-debounce";
import { DEBOUNCE_TIME } from "@/constants";
import { getSpaceAndTracks, findTracksByIssues, getTrackSessionStats } from "@/lib/supabase/queries";
import { searchIssues } from "@/lib/github/queries";
import { useSessions } from "@/hooks/api/use-sessions";
import { useAccessibleRepos } from "@/hooks/api/use-repo-permissions";
import { formatTime } from "@/lib/utils";
import type { GitHubIssue } from "@/types";

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, DEBOUNCE_TIME);

  const { slug } = useParams({ from: "/space/$slug" });
  const sessionsHook = useSessions(slug);

  // Get space data for tracks
  const { data: spaceData, refetch: refetchSpaceData } = useQuery({
    queryKey: ["space", slug],
    queryFn: () => getSpaceAndTracks(slug),
    enabled: !!slug,
    staleTime: 0, // Always consider data stale to ensure fresh tracks
  });

  // Get accessible repos for the user (only fetch when we have space data)
  const { data: accessibleRepos } = useAccessibleRepos(
    spaceData?.space?.id || '',
    "read"
  );

  // Search GitHub issues in the whole org
  const {
    data: rawSearchResults,
    isLoading: isSearching,
    refetch,
  } = useQuery({
    queryKey: ["sessions", "issues", slug, debouncedSearchQuery],
    queryFn: () => searchIssues(slug, debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim() && !!slug,
    retry: false,
    staleTime: 0, // 5 minutes
    gcTime: 0, // 5 minutes
  });

  // Filter search results by accessible repos
  const searchResults = React.useMemo(() => {
    if (!rawSearchResults || !accessibleRepos) return rawSearchResults;

    return rawSearchResults.filter((issue) => {
      return accessibleRepos.some(
        (repo) =>
          repo.repo_owner === issue.repository.owner &&
          repo.repo_name === issue.repository.name
      );
    });
  }, [rawSearchResults, accessibleRepos]);

  // Fetch tracks for current search results to show correct UI state
  const { data: searchResultTracks } = useQuery({
    queryKey: ["searchResultTracks", spaceData?.space?.id, searchResults?.map(r => `${r.repository.owner}/${r.repository.name}#${r.number}`)],
    queryFn: () =>
      findTracksByIssues(
        spaceData?.space?.id || "",
        searchResults?.map((issue) => ({
          repoOwner: issue.repository.owner || "",
          repoName: issue.repository.name || "",
          issueNumber: issue.number,
        })) || []
      ),
    enabled: !!spaceData?.space?.id && !!searchResults && searchResults.length > 0,
  });

  // Fetch session stats for command palette search result tracks
  const { data: commandPaletteSessionStats } = useQuery({
    queryKey: ["commandPaletteSessionStats", Array.from(searchResultTracks?.values() || []).map((t) => t.id)],
    queryFn: () =>
      getTrackSessionStats(
        Array.from(searchResultTracks?.values() || []).map((t) => t.id)
      ),
    enabled: !!searchResultTracks && searchResultTracks.size > 0,
  });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset search query when dialog closes and refetch when dialog opens
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    } else {
      // Refetch tracks and search results when dialog opens to ensure fresh data
      refetchSpaceData();
      if (debouncedSearchQuery.trim()) {
        refetch();
      }
    }
  }, [open, debouncedSearchQuery, refetch, refetchSpaceData]);

  const handleStartSession = (trackId: string) => {
    if (
      !sessionsHook.activeSession &&
      !sessionsHook.startSessionMutation.isPending
    ) {
      sessionsHook.startSessionMutation.mutate(trackId);
      setOpen(false);
      setSearchQuery("");
    }
  };

  const handleCreateTrackAndStartSession = (issue: GitHubIssue) => {
    sessionsHook.createTrackAndStartSessionMutation.mutate(issue);
    setOpen(false);
    setSearchQuery("");
  };

  const getTrackForIssue = (issue: GitHubIssue) => {
    // First check loaded tracks (fast for most cases)
    const loadedTrack = spaceData?.tracks?.find(
      (track) =>
        track.repo_owner === issue.repository.owner &&
        track.repo_name === issue.repository.name &&
        track.issue_number === issue.number
    );

    if (loadedTrack) return loadedTrack;

    // Then check database-fetched tracks for search results (handles >1000 tracks)
    if (searchResultTracks) {
      const key = `${issue.repository.owner}/${issue.repository.name}#${issue.number}`;
      return searchResultTracks.get(key) || null;
    }

    return null;
  };

  const isCurrentSessionTrack = (trackId: string) => {
    return sessionsHook.activeSession?.track.id === trackId;
  };

  const getSessionCount = (trackId: string) => {
    // Check command palette session stats for search results
    if (commandPaletteSessionStats?.counts[trackId]) {
      return commandPaletteSessionStats.counts[trackId];
    }
    // Fall back to sessionsHook stats
    return sessionsHook.getSessionCount(trackId);
  };

  const getTotalDuration = (trackId: string) => {
    // Check command palette session stats for search results
    if (commandPaletteSessionStats?.durations[trackId]) {
      return formatTime(commandPaletteSessionStats.durations[trackId]);
    }
    // Fall back to sessionsHook stats
    return sessionsHook.getTotalDuration(trackId);
  };

  return {
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    isSearching,
    spaceData,
    searchResults,
    sessionsHook,
    handleStartSession,
    handleCreateTrackAndStartSession,
    getTrackForIssue,
    isCurrentSessionTrack,
    getSessionCount,
    getTotalDuration,
    refetch,
  };
}
