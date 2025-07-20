import { useQuery } from "@tanstack/react-query";
import {
  getSpaceMembersWithProfiles,
  getActiveSession,
  getMemberSessionAggregations,
  getSpaceBySlug,
} from "@/lib/supabase/queries";
import { getDateRangeForFilter } from "@/lib/utils";

export function useSpaceMembers(slug: string, timeFilter: "today" | "week" | "month" = "today") {
  const { data: members, isLoading } = useQuery({
    queryKey: ["getSpaceMembers", slug],
    queryFn: () => getSpaceMembersWithProfiles(slug),
  });

  const { data: space } = useQuery({
    queryKey: ["getSpace", slug],
    queryFn: () => getSpaceBySlug(slug),
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

  const { data: timeAggregations } = useQuery({
    queryKey: ["memberTimeAggregations", slug, timeFilter, space?.id],
    queryFn: async () => {
      if (!space?.id) return {};
      const { startDate, endDate } = getDateRangeForFilter(timeFilter);
      return await getMemberSessionAggregations(space.id, startDate, endDate);
    },
    enabled: !!space?.id,
  });

  // Combine members with their time aggregations
  const membersWithTime = members?.map(({ member, profile }) => ({
    member,
    profile,
    timeWorked: timeAggregations?.[member.id] || 0,
  }));

  return {
    members: membersWithTime,
    isLoading,
    activeSessions,
    timeAggregations,
  };
}
