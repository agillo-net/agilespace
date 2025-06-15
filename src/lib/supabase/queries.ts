import { getSupabaseClient } from "@/lib/supabase/client";
import type { Profile, Space, SpaceMember, SpaceWithMembership, Tag, Track } from "@/types";

const supabase = getSupabaseClient();

export const getUser = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }

  return data.session?.user;
};

export const getProfile = async () => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

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
    (userSpaces as unknown as ({ space: Space } & SpaceMember)[] || []).map((row) => [row.space.id, row.role])
  );

  // Combine the data
  return (allSpaces as Space[] || []).map((space) => ({
    ...space,
    is_member: userJoinedSpaces.has(space.id),
    member_role: userJoinedSpaces.get(space.id) || null,
  }));
};


/**
 * Fetches a space by its slug.
 * This function retrieves a single space from the database based on its slug.
 * It uses the Supabase client to query the "spaces" table.
 * @async
 * @function getSpaceBySlug
 * @param {string} slug - The slug of the space to retrieve.
 * @throws {Error} If the query fails or if the space is not found.
 * @return {Promise<Space | null>} A promise that resolves to the space object if found, or null if not found.
 */
export const getSpaceBySlug = async (slug: string): Promise<Space | null> => {
  const { data, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(error.message);
  }

  return data as Space;
}



/**
 * Fetches a space by its slug and checks if the user is a member of the space.
 * This function retrieves a single space from the database based on its slug and checks if the user is a member of the space.
 * It uses the Supabase client to query the "spaces" and "space_members" tables.
 * @async
 * @function getUserMemberSpace
 * @param {string} spaceSlug - The slug of the space to retrieve and check membership for.
 * @throws {Error} If the user ID is not found or if the query fails.
 * @return {Promise<{ space: Space | null, isMember: boolean }>} A promise that resolves to an object containing the space data and a boolean indicating if the user is a member of the space.
 */
export const getUserMemberSpace = async (spaceSlug: string): Promise<{ space: Space | null, isMember: boolean }> => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data: spaceData, error: spaceError } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", spaceSlug)
    .single();

  if (spaceError) {
    if (spaceError.code === "PGRST116") return { space: null, isMember: false }; // Not found
    throw new Error(spaceError.message);
  }

  const { data: memberData, error: memberError } = await supabase
    .from("space_members")
    .select("*")
    .eq("space_id", spaceData.id)
    .eq("user_id", userId)
    .single();

  if (memberError && memberError.code !== "PGRST116") throw new Error(memberError.message);

  return { space: spaceData, isMember: memberData !== null };
}

export const getSpaceTracks = async (spaceId: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('space_id', spaceId);
  if (error) throw new Error(error.message);
  return data || [];
};

export const getSpaceAndTracks = async (spaceSlug: string): Promise<{
  space: Space | null;
  tracks: Track[] | [];
  space_member: SpaceMember | null;
}> => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data: spaceData, error: spaceError } = await supabase
    .from('spaces')
    .select('*')
    .eq('slug', spaceSlug)
    .single();

  if (spaceError) {
    if (spaceError.code === "PGRST116") return { space: null, tracks: [], space_member: null }; // Not found
    throw new Error(spaceError.message);
  }

  const tracks = await getSpaceTracks(spaceData.id);

  // Get space member info
  const { data: memberData, error: memberError } = await supabase
    .from("space_members")
    .select("*")
    .eq("space_id", spaceData.id)
    .eq("user_id", userId)
    .single();

  if (memberError && memberError.code !== "PGRST116") throw new Error(memberError.message);

  return {
    space: spaceData,
    tracks,
    space_member: memberData
  };
}

/**
 * Fetches all members of a space with their details.
 * @async
 * @function getSpaceMembers
 * @param {string} spaceSlug - The slug of the space to get members for
 * @throws {Error} If the query fails
 * @returns {Promise<Array>} A promise that resolves to an array of space members with their details
 */
export const getSpaceMembersWithProfiles = async (spaceSlug: string): Promise<{
  member: SpaceMember;
  profile: Profile;
}[]> => {
  // First get the space ID from the slug
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id")
    .eq("slug", spaceSlug)
    .single();

  if (spaceError) throw new Error(spaceError.message);
  if (!space) throw new Error("Space not found");

  // Then get all members with their profile details
  const { data: members, error: membersError } = await supabase
    .from("space_members")
    .select(`*`)
    .eq("space_id", space.id);

  // If there's an error fetching members, throw it
  if (membersError) throw new Error(membersError.message);

  // If no members are found, return an empty array
  if (!members) return [];

  // If members are found, fetch their profiles
  const memberIds = members.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", memberIds);

  // If there's an error fetching profiles, throw it
  if (profilesError) throw new Error(profilesError.message);

  // Combine members with their profiles
  return members.map((member) => {
    const profile = profiles?.find((p) => p.id === member.user_id);
    return {
      member,
      profile
    }
  });
};

export async function getActiveSession() {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      space_member:space_members!inner(*),
      track:tracks!inner(*)
    `)
    .eq('space_members.user_id', userId)
    .is("ended_at", null)
    .single();
  if (error && error.code !== "PGRST116") throw new Error(error.message); // PGRST116 is "no rows returned"
  return data;
}

export async function getClosedSessions(spaceId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      track:tracks!inner(*),
      tags:session_tags(
        tag:tags(*)
      )
    `)
    .eq('tracks.space_id', spaceId)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getTrackSessionStats(trackIds: string[]) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .in("track_id", trackIds);
  if (error) throw new Error(error.message);

  // Calculate both counts and durations per track
  const stats = trackIds.reduce((acc, trackId) => {
    const trackSessions = data?.filter(session => session.track_id === trackId) || [];

    // Calculate count
    acc.counts[trackId] = trackSessions.length;

    // Calculate duration (only for completed sessions)
    const totalDuration = trackSessions
      .filter(session => session.ended_at)
      .reduce((total, session) => {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at!).getTime();
        return total + (end - start);
      }, 0);
    acc.durations[trackId] = totalDuration;

    return acc;
  }, { counts: {}, durations: {} } as { counts: Record<string, number>, durations: Record<string, number> });

  return stats;
}

export async function getTags(spaceId: string) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('space_id', spaceId)
    .order('name')

  if (error) throw error
  return data as Tag[]
}
