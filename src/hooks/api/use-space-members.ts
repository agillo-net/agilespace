import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpaceMembersWithProfiles,
  getActiveSession,
  getMemberSessionAggregations,
  getSpaceBySlug,
} from "@/lib/supabase/queries";
import { updateSpaceMemberRole } from "@/lib/supabase/mutations";
import { getDateRangeForFilter } from "@/lib/utils";
import { queryKeys } from "@/lib/query-keys";

export function useSpaceMembers(slug: string, timeFilter: "today" | "week" | "month" = "today") {
  const { data: members, isLoading } = useQuery({
    queryKey: queryKeys.spaceMembers.withProfiles(slug),
    queryFn: () => getSpaceMembersWithProfiles(slug),
  });

  const { data: space } = useQuery({
    queryKey: queryKeys.spaces.bySlug(slug),
    queryFn: () => getSpaceBySlug(slug),
  });

  const { data: activeSessions } = useQuery({
    queryKey: [...queryKeys.sessions.active(slug), members],
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
    queryKey: queryKeys.sessions.aggregations(space?.id || "", timeFilter),
    queryFn: async () => {
      if (!space?.id) return {};
      const { startDate, endDate } = getDateRangeForFilter(timeFilter);
      return await getMemberSessionAggregations(space.id, startDate, endDate);
    },
    enabled: !!space?.id,
  });

  // Combine members with their time aggregations (sorting is handled in the query)
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

/**
 * Hook for updating space member roles
 */
export function useUpdateSpaceMemberRole(spaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spaceMemberId,
      newRole,
    }: {
      spaceMemberId: string;
      newRole: "admin" | "member" | "observer";
    }) => updateSpaceMemberRole({ spaceMemberId, newRole }),
    onSuccess: () => {
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaceMembers.withProfiles(spaceSlug),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.spaceMembers.bySpace(spaceSlug),
      });
    },
  });
}
