import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  getSpaceAndTracks,
  getActiveSession,
  getClosedSessions,
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

  // Load closed sessions
  const { data: closedSessions } = useQuery({
    queryKey: ["closedSessions", spaceData?.space?.id],
    queryFn: () => getClosedSessions(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load session stats for tracks
  const { data: sessionStats } = useQuery({
    queryKey: ["sessionStats", spaceData?.tracks?.map((t) => t.id)],
    queryFn: () =>
      getTrackSessionStats(spaceData?.tracks?.map((t) => t.id) || []),
    enabled: !!spaceData?.tracks?.length,
  });

  // Load all active sessions for the space
  const { data: spaceActiveSessions } = useQuery({
    queryKey: ["spaceActiveSessions", spaceData?.space?.id],
    queryFn: () => getSpaceActiveSessions(spaceData?.space?.id || ""),
    enabled: !!spaceData?.space?.id,
  });

  // Load space members to get accurate member count
  const { data: spaceMembers } = useQuery({
    queryKey: ["spaceMembers", slug],
    queryFn: () => getSpaceMembersWithProfiles(slug),
    enabled: !!slug,
  });

  // Calculate total sessions
  const totalSessions = closedSessions?.length || 0;
  const activeSessionsCount = activeSession ? 1 : 0;

  // Calculate total tracks
  const totalTracks = spaceData?.tracks?.length || 0;

  // Calculate total members
  const totalMembers = spaceMembers?.length || 0;

  // Calculate total tags
  const totalTags = spaceData?.tags?.length || 0;

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
