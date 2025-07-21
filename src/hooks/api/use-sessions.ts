import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpaceAndTracks,
  getClosedSessions,
  getActiveSession,
  getTrackSessionStats,
} from "@/lib/supabase/queries";
import { searchIssues } from "@/lib/github/queries";
import {
  createTrack,
  createSession,
  endSession,
  linkTagToSession,
  deleteSession,
} from "@/lib/supabase/mutations";
import { createIssueComment } from "@/lib/github/mutations";
import { useDebounce } from "@/hooks/use-debounce";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { formatSessionComment, formatTime } from "@/lib/utils";
import { DEBOUNCE_TIME } from "@/constants";
import { notifySessionEvent } from "@/lib/notifications/utils";
import { useAuth } from "@/hooks/api/use-auth";
import type { GitHubIssue, Tag } from "@/types";

export function useSessions(slug: string, initialTrackFilter?: string | null) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useDebounce(
    searchQuery,
    DEBOUNCE_TIME
  );
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [endSessionMessage, setEndSessionMessage] = useLocalStorage(
    "end-session-message",
    ""
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "day" | "week">("all");
  const [sessionLimit, setSessionLimit] = useState<number>(10);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(initialTrackFilter || null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: spaceData, isLoading: isLoadingSpace } = useQuery({
    queryKey: ["space", slug],
    queryFn: () => getSpaceAndTracks(slug),
  });

  const { data: closedSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["closedSessions", spaceData?.space?.id],
    queryFn: () => getClosedSessions(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  const { data: activeSession } = useQuery({
    queryKey: ["activeSession", slug],
    queryFn: () => getActiveSession(),
    enabled: !!slug,
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["sessions", "issues", slug, debouncedSearchQuery],
    queryFn: () => searchIssues(slug, debouncedSearchQuery),
    enabled: !!debouncedSearchQuery.trim(),
    retry: false,
  });

  const { data: sessionStats } = useQuery({
    queryKey: ["sessionStats", spaceData?.tracks?.map((t) => t.id)],
    queryFn: () =>
      getTrackSessionStats(spaceData?.tracks?.map((t) => t.id) || []),
    enabled: !!spaceData?.tracks?.length,
  });

  const endSessionMutation = useMutation({
    mutationFn: async ({
      sessionId,
      message,
      skipSummary,
      selectedTags,
    }: {
      sessionId: string;
      message: string;
      skipSummary: boolean;
      selectedTags: Tag[];
    }) => {
      if (!activeSession?.track) throw new Error("No active track found");
      const startDate = new Date(activeSession.started_at);
      const endDate = new Date();
      const duration = endDate.getTime() - startDate.getTime();
      let commentUrl: string | undefined;
      if (!skipSummary) {
        const response = await createIssueComment({
          owner: activeSession.track.repo_owner,
          repo: activeSession.track.repo_name,
          issue_number: activeSession.track.issue_number,
          body: formatSessionComment(duration, message),
        });
        commentUrl = response.html_url;
      }
      await endSession(
        sessionId,
        commentUrl,
        skipSummary,
        endDate.toISOString()
      );
      for (const tag of selectedTags) {
        await linkTagToSession(sessionId, tag.id);
      }
      
      // Send notification
      if (user) {
        await notifySessionEvent(user, {
          type: 'end',
          trackTitle: activeSession.track.title || 'Untitled Track',
          duration: duration,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSession", slug] });
      queryClient.invalidateQueries({
        queryKey: ["closedSessions", spaceData?.space?.id],
      });
      setShowEndSessionDialog(false);
      setEndSessionMessage("");
      toast.success("Session ended successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to end session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });

  const discardSessionMutation = useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      await deleteSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSession", slug] });
      setShowDiscardDialog(false);
      toast.success("Session discarded successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to discard session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!spaceData?.space_member) return;
      const session = await createSession({
        track_id: trackId,
        space_member_id: spaceData.space_member.id,
      });
      
      // Send notification
      if (user && spaceData?.tracks) {
        const track = spaceData.tracks.find(t => t.id === trackId);
        if (track) {
          await notifySessionEvent(user, {
            type: 'start',
            trackTitle: track.title || 'Untitled Track',
          });
        }
      }
      
      return session;
    },
    onSuccess: () => {
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["activeSession", slug] });
      toast.success("Session started successfully");
    },
    onError: (error) => {
      toast.error(
        `Failed to start session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });

  const createTrackAndStartSessionMutation = useMutation({
    mutationFn: async (issue: GitHubIssue) => {
      if (!spaceData?.space || !spaceData.space_member) {
        throw new Error("Space or space member not found");
      }

      let track = getTrackForIssue(issue);
      if (!track) {
        track = await createTrack({
          space_id: spaceData.space.id,
          repo_owner: issue.repository.owner || "",
          repo_name: issue.repository.name || "",
          issue_number: issue.number,
          title: issue.title,
        });
      }

      if (!track) {
        throw new Error("Failed to create or find track");
      }

      await createSession({
        track_id: track.id,
        space_member_id: spaceData.space_member.id,
      });

      // Send notification
      if (user && track) {
        await notifySessionEvent(user, {
          type: 'start',
          trackTitle: track.title || 'Untitled Track',
        });
      }

      return track;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", slug] });
      queryClient.invalidateQueries({ queryKey: ["activeSession", slug] });
      setSearchQuery("");
      toast.success("Track created and session started");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create track: ${error.message}`);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setDebouncedSearchQuery(searchQuery);
  };

  const handleCreateTrackAndStartSession = (issue: GitHubIssue) => {
    createTrackAndStartSessionMutation.mutate(issue);
  };

  const handleEndSession = (skipSummary: boolean, selectedTags: Tag[]) => {
    if (activeSession && (endSessionMessage.trim() || skipSummary)) {
      endSessionMutation.mutate({
        sessionId: activeSession.id,
        message: endSessionMessage.trim(),
        skipSummary,
        selectedTags,
      });
    }
  };

  const handleDiscardSession = () => {
    if (activeSession) {
      discardSessionMutation.mutate({ sessionId: activeSession.id });
    }
  };

  const getSessionCount = (trackId: string) => {
    if (!sessionStats) return 0;
    return sessionStats.counts[trackId] || 0;
  };

  const handleStartSession = (trackId: string) => {
    if (!activeSession && !startSessionMutation.isPending) {
      startSessionMutation.mutate(trackId);
    }
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

  const getTotalDuration = (trackId: string) => {
    if (!sessionStats) return "0h 0m";
    const duration = sessionStats.durations[trackId] || 0;
    return formatTime(duration);
  };

  const isCurrentSessionTrack = (trackId: string) => {
    return activeSession?.track.id === trackId;
  };

  return {
    searchQuery,
    setSearchQuery,
    showEndSessionDialog,
    setShowEndSessionDialog,
    showDiscardDialog,
    setShowDiscardDialog,
    endSessionMessage,
    setEndSessionMessage,
    selectedMembers,
    setSelectedMembers,
    timeFilter,
    setTimeFilter,
    sessionLimit,
    setSessionLimit,
    selectedTrack,
    setSelectedTrack,
    spaceData,
    isLoadingSpace,
    closedSessions,
    isLoadingSessions,
    activeSession,
    searchResults,
    isSearching,
    searchError,
    endSessionMutation,
    discardSessionMutation,
    startSessionMutation,
    createTrackAndStartSessionMutation,
    handleSearch,
    handleCreateTrackAndStartSession,
    handleEndSession,
    handleDiscardSession,
    getSessionCount,
    handleStartSession,
    getTrackForIssue,
    getTotalDuration,
    isCurrentSessionTrack,
  };
}
