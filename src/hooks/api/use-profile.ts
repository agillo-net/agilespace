import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/supabase/queries";
import { queryKeys } from "@/lib/query-keys";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile(),
    queryFn: getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}
