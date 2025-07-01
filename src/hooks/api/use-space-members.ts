import { useQuery } from "@tanstack/react-query";
import {
  getSpaceMembersWithProfiles,
  getActiveSession,
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
          } catch (error) {
            // It's better to return null and filter later than to throw
            return null;
          }
        })
      );
      return sessions.filter(Boolean);
    },
    enabled: !!members,
  });

  return {
    members,
    isLoading,
    activeSessions,
  };
}
