import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/use-debounce";
import { DEBOUNCE_TIME } from "@/constants";
import { getSpaceAndTracks } from "@/lib/supabase/queries";
import { searchIssues } from "@/lib/github/queries";
import { useSessions } from "@/hooks/api/use-sessions";
import { useAccessibleRepos } from "@/hooks/api/use-repo-permissions";
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
    if (!spaceData?.tracks) return null;
    return spaceData.tracks.find(
      (track) =>
        track.repo_owner === issue.repository.owner &&
        track.repo_name === issue.repository.name &&
        track.issue_number === issue.number
    );
  };

  const isCurrentSessionTrack = (trackId: string) => {
    return sessionsHook.activeSession?.track.id === trackId;
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
    refetch,
  };
}
