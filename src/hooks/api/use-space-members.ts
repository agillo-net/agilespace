import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSpaceMembersWithProfiles,
  getActiveSession,
  getClosedSessions,
} from "@/lib/supabase/queries";

export function useSpaceMembers(slug: string) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["getSpaceMembers", slug],
    queryFn: () => getSpaceMembersWithProfiles(slug),
  });

  const { data: activeSessions } = useQuery({
    queryKey: ["activeSessions", slug, members],
    queryFn: async () => {
      if (!members) return [];
      const sessions = await Promise.all(
        members.map(async ({ member }) => {
          try {
            if (!member.user_id) return null;
            return await getActiveSession(member.user_id);
          } catch {
            // It's better to return null and filter later than to throw
            return null;
          }
        })
      );
      return sessions.filter(Boolean);
    },
    enabled: !!members,
  });

  const spaceId = members && members.length > 0 ? members[0].member.space_id : null;

  const { data: closedSessions } = useQuery({
    queryKey: ["closedSessionsToday", spaceId],
    queryFn: () => getClosedSessions(spaceId || ""),
    enabled: !!spaceId,
  });

  const dailyDurations = React.useMemo(() => {
    if (!closedSessions) return {} as Record<string, number>;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const durations: Record<string, number> = {};

    closedSessions.forEach((session) => {
      if (!session.ended_at) return;
      if (new Date(session.ended_at) < startOfDay) return;
      const userId = session.space_member?.user_id;
      if (!userId) return;
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      durations[userId] = (durations[userId] || 0) + (end - start);
    });

    if (activeSessions) {
      const now = Date.now();
      activeSessions.forEach((session) => {
        const userId = session?.space_member?.user_id;
        if (!userId) return;
        const start = new Date(session.started_at).getTime();
        if (start < startOfDay.getTime()) return;
        durations[userId] = (durations[userId] || 0) + (now - start);
      });
    }

    return durations;
  }, [closedSessions, activeSessions]);

  return {
    members,
    isLoading,
    activeSessions,
    dailyDurations,
  };
}
