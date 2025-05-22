import { getSupabaseClient } from "@/lib/supabase/client";

export const getProfile = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error("Failed to fetch profile");
  }

  return data;
};

export const getUserOrganizations = async (userId: string | undefined) => {
  if (!userId) throw new Error("User ID is required");
  const supabase = getSupabaseClient();
  // Get organizations where the user is a member
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization:organizations(*)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  console.log("getUserOrganizations", data);
  // Flatten the organizations
  return data?.map((row: any) => row.organization) || [];
};
