import { getSupabaseClient } from "@/lib/supabase/client";
import type { Space, SpaceMember, SpaceWithMembership } from "./queries.type";

export const getUser = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session?.user;
};

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


/**
 * 
 * Fetches all spaces from the database.
 * This function retrieves all spaces, ordered by creation date in descending order.
 * It uses the Supabase client to query the "spaces" table.
 * * @async
 * @function getSpaces
 * @returns {Promise<Array>} A promise that resolves to an array of spaces.
 * @throws Error if the query fails
 */
export const getSpaces = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * 
 * Fetches spaces where the current user is a member.
 * This function retrieves all spaces that the authenticated user is a member of,
 * including their role in each space. It uses the Supabase client to query the "space_members" table
 * and joins it with the "spaces" table to get space details.
 * @async
 * @function getUserSpaces
 * @throws {Error} If the user ID is not available or if the query fails.
 * @returns {Promise<Array>} A promise that resolves to an array of spaces where the user is a member.
 */
export const getUserSpaces = async () => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const supabase = getSupabaseClient();

  // Get organizations where the user is a member
  const { data, error } = await supabase
    .from("space_members")
    .select(`space:spaces(*), role`)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  // Flatten the organizations and include role
  return (
    data?.map((row: any) => ({
      ...row.space,
      member_role: row.role,
    })) || []
  );
};

export const getOrganizationAndMemberStatus = async (
  github_org_id: string,
  user_id: string
) => {
  const supabase = getSupabaseClient();

  // Get organization
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("github_org_id", github_org_id)
    .single();

  if (orgError && orgError.code !== "PGRST116")
    throw new Error(orgError.message);

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

  if (memberError && memberError.code !== "PGRST116")
    throw new Error(memberError.message);

  return {
    exists: true,
    isMember: !!member,
    role: member?.role,
  };
};

/**
 * Fetches all spaces and includes information about whether the current user is a member.
 * This function combines the results of getSpaces and getUserSpaces to provide a complete
 * view of all spaces with membership status.
 * @async
 * @function getSpacesWithMembershipStatus
 * @throws {Error} If the user ID is not available or if the query fails
 * @returns {Promise<SpaceWithMembership[]>} A promise that resolves to an array of spaces with membership status
 */
export const getSpacesWithMembershipStatus = async (): Promise<SpaceWithMembership[]> => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const supabase = getSupabaseClient();

  // Get all spaces
  const { data: allSpaces, error: spacesError } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (spacesError) throw new Error(spacesError.message);

  // Get user's joined spaces
  const { data: userSpaces, error: userSpacesError } = await supabase
    .from("space_members")
    .select(`space:spaces(*), role`)
    .eq("user_id", userId);

  if (userSpacesError) throw new Error(userSpacesError.message);

  // Create a map of user's joined spaces for quick lookup
  const userJoinedSpaces = new Map(
    (userSpaces as unknown as SpaceMember[] || []).map((row) => [row.space.id, row.role])
  );

  // Combine the data
  return (allSpaces as Space[] || []).map((space) => ({
    ...space,
    is_member: userJoinedSpaces.has(space.id),
    member_role: userJoinedSpaces.get(space.id) || null,
  }));
};
