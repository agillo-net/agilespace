import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/queries";

const supabase = getSupabaseClient();

export const getCurrentUserSpaceRole = async (spaceId: string): Promise<string | null> => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId || !spaceId) return null;

  const { data, error } = await supabase
    .from("space_members")
    .select("role")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data?.role || null;
};

export const useSpaceRole = (spaceId: string) => {
  return useQuery({
    queryKey: ["spaceRole", spaceId],
    queryFn: () => getCurrentUserSpaceRole(spaceId),
    enabled: !!spaceId,
  });
};

export const useIsSpaceAdmin = (spaceId: string) => {
  const { data: role } = useSpaceRole(spaceId);
  return role === 'admin';
};