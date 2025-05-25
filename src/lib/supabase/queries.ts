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

export const getOrganizationByGithubId = async (github_org_id: string) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("github_org_id", github_org_id)
    .single();
  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
};

export const getUserOrganizations = async (userId: string | undefined) => {
  if (!userId) throw new Error("User ID is required");
  const supabase = getSupabaseClient();
  // Get organizations where the user is a member
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization:organizations(*),
      role
    `)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  // Flatten the organizations and include role
  return data?.map((row: any) => ({
    ...row.organization,
    member_role: row.role
  })) || [];
};

export const getOrganizationAndMemberStatus = async (github_org_id: string, user_id: string) => {
  const supabase = getSupabaseClient();

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("github_org_id", github_org_id)
    .single();

  if (orgError && orgError.code !== "PGRST116") throw new Error(orgError.message);

  if (!org) {
    return { exists: false, isMember: false };
  }

  // Check if user is a member
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", org.id)
    .eq("user_id", user_id)
    .single();

  if (memberError && memberError.code !== "PGRST116") throw new Error(memberError.message);

  return {
    exists: true,
    isMember: !!member,
    role: member?.role
  };
};
