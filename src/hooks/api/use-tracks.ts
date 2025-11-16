import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSpaceAndTracks, getTracksWithSessionData } from "@/lib/supabase/queries";
import { searchIssues } from "@/lib/github/queries";
import { queryKeys } from "@/lib/query-keys";
import type { GitHubIssue } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import { DEBOUNCE_TIME } from "@/constants";

export function useTracks(slug: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useDebounce(
    searchQuery,
    DEBOUNCE_TIME
  );

  const { data: spaceData, isLoading } = useQuery({
    queryKey: queryKeys.spaces.withTracks(slug),
    queryFn: () => getSpaceAndTracks(slug),
  });

  const { data: tracksWithSessionData, isLoading: isLoadingTracks } = useQuery({
    queryKey: queryKeys.tracks.withSessionData(spaceData?.space?.id!),
    queryFn: () => getTracksWithSessionData(spaceData!.space!.id),
    enabled: !!spaceData?.space?.id,
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: queryKeys.search.sessions(slug, debouncedSearchQuery),
    queryFn: () => searchIssues(slug, debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim(),
    retry: false,
  });


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setDebouncedSearchQuery(searchQuery);
  };

  const isTracked = (issue: GitHubIssue) => {
    if (!issue.repository) return false;
    return spaceData?.tracks.some(
      (track) =>
        track.repo_owner === issue.repository.owner &&
        track.repo_name === issue.repository.name &&
        track.issue_number === issue.number
    );
  };

  return {
    searchQuery,
    setSearchQuery,
    isLoading: isLoading || isLoadingTracks,
    searchResults,
    isSearching,
    searchError,
    tracks: spaceData?.tracks || [],
    tracksWithSessionData: tracksWithSessionData || [],
    handleSearch,
    isTracked,
  };
}
