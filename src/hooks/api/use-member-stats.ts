import { useQuery } from "@tanstack/react-query";
import {
  getMemberById,
  getMemberSessions,
  getMemberTrackStats,
  getMemberActiveSession,
} from "@/lib/supabase/queries";
import { getDateRangeForFilter } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";

export function useMemberStats(
  memberId: string,
  spaceId: string,
  timeFilter: "today" | "week" | "month" = "week"
) {
  const canFetch = !!memberId && !!spaceId;

  // Fetch member and profile data
  const {
    data: memberData,
    isLoading: isMemberLoading,
    error: memberError,
  } = useQuery({
    queryKey: queryKeys.memberStats.detail(memberId, spaceId),
    queryFn: () => getMemberById(memberId, spaceId),
    enabled: canFetch,
  });

  // Get date range based on filter
  const { startDate, endDate } = getDateRangeForFilter(timeFilter);

  // Fetch sessions for the member
  const {
    data: sessionsData,
    isLoading: isSessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: queryKeys.memberStats.sessions(memberId, timeFilter, startDate, endDate),
    queryFn: () => getMemberSessions(memberId, startDate, endDate),
    enabled: canFetch,
  });

  // Fetch track statistics
  const {
    data: trackStats,
    isLoading: isTrackStatsLoading,
    error: trackStatsError,
  } = useQuery({
    queryKey: queryKeys.memberStats.trackStats(memberId, timeFilter, startDate, endDate),
    queryFn: () => getMemberTrackStats(memberId, startDate, endDate),
    enabled: canFetch,
  });

  // Fetch active session
  const {
    data: activeSession,
    isLoading: isActiveSessionLoading,
    error: activeSessionError,
  } = useQuery({
    queryKey: queryKeys.memberStats.activeSession(memberId),
    queryFn: () => getMemberActiveSession(memberId),
    enabled: canFetch,
  });

  // If we can't fetch yet, we're still loading
  const isLoading = !canFetch ||
    isMemberLoading ||
    isSessionsLoading ||
    isTrackStatsLoading ||
    isActiveSessionLoading;

  const error =
    memberError || sessionsError || trackStatsError || activeSessionError;

  return {
    member: memberData?.member,
    profile: memberData?.profile,
    sessions: sessionsData?.sessions || [],
    totalSessions: sessionsData?.totalSessions || 0,
    totalDuration: sessionsData?.totalDuration || 0,
    trackStats: trackStats || [],
    activeSession,
    isLoading,
    error,
  };
}
