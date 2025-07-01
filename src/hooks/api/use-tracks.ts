import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrack, createSession } from "@/lib/supabase/mutations";
import { getSpaceAndTracks } from "@/lib/supabase/queries";
import { searchIssues } from "@/lib/github/queries";
import type { GitHubIssue } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { DEBOUNCE_TIME } from "@/constants";

export function useTracks(slug: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useDebounce(
    searchQuery,
    DEBOUNCE_TIME
  );
  const queryClient = useQueryClient();

  const { data: spaceData, isLoading } = useQuery({
    queryKey: ["space", slug],
    queryFn: () => getSpaceAndTracks(slug),
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["tracks", "issues", slug, debouncedSearchQuery],
    queryFn: () => searchIssues(slug, debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim(),
    retry: false,
  });

  const createTrackMutation = useMutation({
    mutationFn: async (issue: GitHubIssue) => {
      if (!spaceData?.space || !issue.repository) return;
      if (!spaceData.space_member) throw new Error("space_member is null");

      const track = await createTrack({
        space_id: spaceData.space.id,
        repo_owner: issue.repository.owner || "",
        repo_name: issue.repository.name || "",
        issue_number: issue.number,
        title: issue.title,
      });

      await createSession({
        track_id: track.id,
        space_member_id: spaceData.space_member.id,
      });

      return track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", slug] });
      setSearchQuery("");
      toast.success("Track created and session started");
    },
    onError: (error) => {
      toast.error(`Failed to create track: ${error.message}`);
    },
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
    isLoading,
    searchResults,
    isSearching,
    searchError,
    tracks: spaceData?.tracks || [],
    createTrackMutation,
    handleSearch,
    isTracked,
  };
}
