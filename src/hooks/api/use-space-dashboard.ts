import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getSpaceAndTracks,
  getActiveSession,
  getClosedSessions,
  getClosedSessionsCount,
  getActiveSessionsCount,
  getTracksCount,
  getSpaceMembersCount,
  getTagsCount,
  getTrackSessionStats,
  getSpaceActiveSessions,
  getSpaceMembersWithProfiles,
} from "@/lib/supabase/queries";

export function useSpaceDashboard(slug: string) {
  // Load space and tracks data
  const { data: spaceData } = useQuery({
    queryKey: ["space", slug],
    queryFn: () => getSpaceAndTracks(slug),
  });

  // Load active session
  const { data: activeSession } = useQuery({
    queryKey: ["activeSession", slug],
    queryFn: () => getActiveSession(),
    enabled: !!slug,
  });

  // Load closed sessions (for charts, limited to recent sessions)
  const { data: closedSessions } = useQuery({
    queryKey: ["closedSessions", spaceData?.space?.id],
    queryFn: () => getClosedSessions(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load total sessions count (efficient count query for statistics)
  const { data: totalSessionsCount } = useQuery({
    queryKey: ["totalSessionsCount", spaceData?.space?.id],
    queryFn: () => getClosedSessionsCount(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load active sessions count (efficient count query for statistics)
  const { data: activeSessionsCountData } = useQuery({
    queryKey: ["activeSessionsCount", spaceData?.space?.id],
    queryFn: () => getActiveSessionsCount(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load tracks count (efficient count query for statistics)
  const { data: tracksCountData } = useQuery({
    queryKey: ["tracksCount", spaceData?.space?.id],
    queryFn: () => getTracksCount(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load members count (efficient count query for statistics)
  const { data: membersCountData } = useQuery({
    queryKey: ["membersCount", spaceData?.space?.id],
    queryFn: () => getSpaceMembersCount(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load tags count (efficient count query for statistics)
  const { data: tagsCountData } = useQuery({
    queryKey: ["tagsCount", spaceData?.space?.id],
    queryFn: () => getTagsCount(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load session stats for tracks
  const { data: sessionStats } = useQuery({
    queryKey: ["sessionStats", spaceData?.tracks?.map((t) => t.id)],
    queryFn: () =>
      getTrackSessionStats(spaceData?.tracks?.map((t) => t.id) || []),
    enabled: !!spaceData?.tracks?.length,
  });

  // Load all active sessions for the space (for display in the list)
  const { data: spaceActiveSessions } = useQuery({
    queryKey: ["spaceActiveSessions", spaceData?.space?.id],
    queryFn: () => getSpaceActiveSessions(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Use count queries for all statistics (efficient and accurate)
  const totalSessions = totalSessionsCount || 0;
  const activeSessionsCount = activeSessionsCountData || 0;
  const totalTracks = tracksCountData || 0;
  const totalMembers = membersCountData || 0;
  const totalTags = tagsCountData || 0;

  // Prepare session activity data for the line chart
  const sessionActivityData = useMemo(() => {
    if (!closedSessions) return [];

    // Group sessions by date
    const sessionsByDate = closedSessions.reduce((acc, session) => {
      const date = new Date(session.ended_at!).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format for recharts
    return Object.entries(sessionsByDate)
      .map(([date, count]) => ({
        date,
        sessions: count,
      }))
      .slice(-7); // Show last 7 days
  }, [closedSessions]);

  // Prepare track statistics data for the bar chart
  const trackStatsData = useMemo(() => {
    if (!spaceData?.tracks || !sessionStats) return [];

    return spaceData.tracks.map((track) => ({
      name: track.title || "Untitled Track",
      sessions: sessionStats.counts[track.id] || 0,
    }));
  }, [spaceData?.tracks, sessionStats]);

  return {
    spaceData,
    spaceActiveSessions,
    totalSessions,
    activeSessionsCount,
    totalTracks,
    totalMembers,
    totalTags,
    sessionActivityData,
    trackStatsData,
  };
}
