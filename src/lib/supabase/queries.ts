import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  Profile,
  Space,
  SpaceMember,
  SpaceWithMembership,
  Tag,
  Track,
  ClosedSession,
  ActiveSession,
} from "@/types";

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

  // Handle PGRST116 (no rows) gracefully - profile might not exist yet
  if (error && error.code !== "PGRST116") {
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
    data?.map((row) => ({
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
export const getSpacesWithMembershipStatus = async (): Promise<
  SpaceWithMembership[]
> => {
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
    ((userSpaces as unknown as ({ space: Space } & SpaceMember)[]) || []).map(
      (row) => [row.space.id, row.role]
    )
  );

  // Combine the data
  return ((allSpaces as Space[]) || []).map((space) => ({
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
};

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
export const getUserMemberSpace = async (
  spaceSlug: string
): Promise<{ space: Space | null; isMember: boolean }> => {
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

  if (memberError && memberError.code !== "PGRST116")
    throw new Error(memberError.message);

  return { space: spaceData, isMember: memberData !== null };
};

export const getSpaceTracks = async (spaceId: string) => {
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("space_id", spaceId)
    .order("created_at", { ascending: false }) // Order by newest first
    .limit(100000); // Set high limit to avoid default 1000 row limit
  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Finds a specific track by space, repo, and issue number.
 * This is more efficient than loading all tracks when checking for duplicates.
 */
export const findTrackByIssue = async (
  spaceId: string,
  repoOwner: string,
  repoName: string,
  issueNumber: number
) => {
  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("space_id", spaceId)
    .eq("repo_owner", repoOwner)
    .eq("repo_name", repoName)
    .eq("issue_number", issueNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Finds tracks for multiple issues in a single database query.
 * Returns a map of issue keys to tracks for efficient lookup.
 * This uses a single query to check all issues at once.
 */
export const findTracksByIssues = async (
  spaceId: string,
  issues: Array<{ repoOwner: string; repoName: string; issueNumber: number }>
) => {
  if (issues.length === 0) return new Map();

  // Get unique repo owners and names
  const repoKeys = new Set<string>();
  const issueNumbersByRepo = new Map<string, number[]>();

  issues.forEach(issue => {
    const repoKey = `${issue.repoOwner}/${issue.repoName}`;
    repoKeys.add(repoKey);

    if (!issueNumbersByRepo.has(repoKey)) {
      issueNumbersByRepo.set(repoKey, []);
    }
    issueNumbersByRepo.get(repoKey)!.push(issue.issueNumber);
  });

  // Query all tracks for these repos and space
  const allIssueNumbers = issues.map(i => i.issueNumber);

  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .eq("space_id", spaceId)
    .in("issue_number", allIssueNumbers);

  if (error) throw new Error(error.message);

  // Filter to only matching repo/issue combinations and create map
  const trackMap = new Map();
  (data || []).forEach((track) => {
    // Check if this track matches any of our issues
    const matchingIssue = issues.find(
      issue =>
        issue.repoOwner === track.repo_owner &&
        issue.repoName === track.repo_name &&
        issue.issueNumber === track.issue_number
    );

    if (matchingIssue) {
      const key = `${track.repo_owner}/${track.repo_name}#${track.issue_number}`;
      trackMap.set(key, track);
    }
  });

  return trackMap;
};

export const getSpaceAndTracks = async (
  spaceSlug: string
): Promise<{
  space: Space | null;
  tracks: Track[] | [];
  space_member: SpaceMember | null;
  tags: Tag[] | [];
}> => {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data: spaceData, error: spaceError } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", spaceSlug)
    .single();

  if (spaceError) {
    if (spaceError.code === "PGRST116")
      return { space: null, tracks: [], space_member: null, tags: [] }; // Not found
    throw new Error(spaceError.message);
  }

  const tracks = await getSpaceTracks(spaceData.id);
  const tags = await getTags(spaceData.id);

  // Get space member info
  const { data: memberData, error: memberError } = await supabase
    .from("space_members")
    .select("*")
    .eq("space_id", spaceData.id)
    .eq("user_id", userId)
    .single();

  if (memberError && memberError.code !== "PGRST116")
    throw new Error(memberError.message);

  return {
    space: spaceData,
    tracks,
    space_member: memberData,
    tags,
  };
};

/**
 * Fetches all members of a space with their details.
 * @async
 * @function getSpaceMembers
 * @param {string} spaceSlug - The slug of the space to get members for
 * @throws {Error} If the query fails
 * @returns {Promise<Array>} A promise that resolves to an array of space members with their details
 */
export const getSpaceMembersWithProfiles = async (
  spaceSlug: string
): Promise<
  {
    member: SpaceMember;
    profile: Profile;
  }[]
> => {
  // First get the space ID from the slug
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id")
    .eq("slug", spaceSlug)
    .single();

  if (spaceError) throw new Error(spaceError.message);
  if (!space) throw new Error("Space not found");

  // Then get all members with their profile details, sorted by joined_at (newest first)
  const { data: members, error: membersError } = await supabase
    .from("space_members")
    .select(`*`)
    .eq("space_id", space.id)
    .order("joined_at", { ascending: false });

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
      profile,
    };
  });
};

export async function getActiveSession(userId?: string) {
  const user = userId ? { id: userId } : await getUser();
  const currentUserId = user?.id;
  if (!currentUserId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      space_member:space_members!inner(*),
      track:tracks!inner(*)
    `
    )
    .eq("space_members.user_id", currentUserId)
    .is("ended_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getClosedSessionsCount(
  spaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("sessions")
    .select("*, tracks!inner(space_id)", { count: 'exact', head: true })
    .eq("tracks.space_id", spaceId);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getActiveSessionsCount(
  spaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("sessions")
    .select("*, tracks!inner(space_id)", { count: 'exact', head: true })
    .eq("tracks.space_id", spaceId)
    .is("ended_at", null);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getTracksCount(
  spaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("tracks")
    .select("*", { count: 'exact', head: true })
    .eq("space_id", spaceId);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getSpaceMembersCount(
  spaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("space_members")
    .select("*", { count: 'exact', head: true })
    .eq("space_id", spaceId);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getTagsCount(
  spaceId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("tags")
    .select("*", { count: 'exact', head: true })
    .eq("space_id", spaceId);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getClosedSessions(
  spaceId: string
): Promise<ClosedSession[]> {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  // First get all sessions with space members
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      `
      *,
      track:tracks!inner(*),
      space_member:space_members!inner(*),
      tags:session_tags(
        tag:tags(*)
      )
    `
    )
    .eq("tracks.space_id", spaceId)
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(100000);

  if (sessionsError) throw new Error(sessionsError.message);
  if (!sessions) return [];

  // Get unique user IDs from space members
  const uniqueUserIds = [
    ...new Set(
      sessions
        .map((session) => session.space_member?.user_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Fetch profiles for all unique users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniqueUserIds);

  if (profilesError) throw new Error(profilesError.message);

  // Create a map of user IDs to profiles for quick lookup
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  // Combine the data
  return sessions.map((session) => ({
    ...session,
    space_member: session.space_member
      ? {
          ...session.space_member,
          profile: session.space_member.user_id
            ? profileMap.get(session.space_member.user_id)
            : null,
        }
      : null,
  })) as unknown as ClosedSession[];
}

export async function getTrackSessionStats(
  spaceIdOrTrackIds: string | string[]
) {
  let data;
  let error;

  // If it's a string, treat as spaceId and fetch all sessions for space
  if (typeof spaceIdOrTrackIds === "string") {
    const result = await supabase
      .from("sessions")
      .select(`
        *,
        track:tracks!inner(space_id)
      `)
      .eq("tracks.space_id", spaceIdOrTrackIds);
    data = result.data;
    error = result.error;
  } else {
    // If it's an array, treat as trackIds
    // If too many track IDs, split into batches to avoid URL length issues
    const trackIds = spaceIdOrTrackIds;
    const BATCH_SIZE = 100; // Safe number to avoid URL length issues

    if (trackIds.length <= BATCH_SIZE) {
      // Small enough to do in one query
      const result = await supabase
        .from("sessions")
        .select("*")
        .in("track_id", trackIds);
      data = result.data;
      error = result.error;
    } else {
      // Split into batches
      const batches = [];
      for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
        batches.push(trackIds.slice(i, i + BATCH_SIZE));
      }

      // Fetch all batches
      const results = await Promise.all(
        batches.map(batch =>
          supabase
            .from("sessions")
            .select("*")
            .in("track_id", batch)
        )
      );

      // Check for errors
      const firstError = results.find(r => r.error);
      if (firstError) {
        error = firstError.error;
      } else {
        // Combine all results
        data = results.flatMap(r => r.data || []);
      }
    }
  }

  if (error) throw new Error(error.message);

  // Calculate both counts and durations per track
  const stats = (data || []).reduce(
    (acc, session) => {
      const trackId = session.track_id;
      if (!trackId) return acc;

      // Initialize track stats if not exists
      if (!acc.counts[trackId]) {
        acc.counts[trackId] = 0;
        acc.durations[trackId] = 0;
      }

      // Increment count
      acc.counts[trackId]++;

      // Calculate duration (only for completed sessions)
      if (session.ended_at) {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        acc.durations[trackId] += (end - start);
      }

      return acc;
    },
    { counts: {}, durations: {} } as {
      counts: Record<string, number>;
      durations: Record<string, number>;
    }
  );

  return stats;
}

export async function getTags(spaceId: string) {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("space_id", spaceId)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getSpaceActiveSessions(
  spaceId: string
): Promise<ActiveSession[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      space_member:space_members!inner(*),
      track:tracks!inner(*)
    `
    )
    .eq("tracks.space_id", spaceId)
    .is("ended_at", null);

  if (error) throw new Error(error.message);
  if (!data) return [];

  // Get unique user IDs from space members
  const uniqueUserIds = [
    ...new Set(
      data
        .map((session) => session.space_member?.user_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Fetch profiles for all unique users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniqueUserIds);

  if (profilesError) throw new Error(profilesError.message);

  // Create a map of user IDs to profiles for quick lookup
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  // Combine the data
  return data.map((session) => ({
    ...session,
    space_member: session.space_member
      ? {
          ...session.space_member,
          profile: session.space_member.user_id
            ? profileMap.get(session.space_member.user_id)
            : null,
        }
      : null,
  })) as unknown as ActiveSession[];
}

/**
 * Gets the current status and location of the authenticated user from the space_members table.
 * This function retrieves the user's current online/offline status and working location.
 * @async
 * @function getCurrentMemberStatus
 * @returns {Promise<{status: string, location: string} | null>} A promise that resolves to the current status and location, or null if not found.
 * @throws {Error} If the user ID is not available or if the query fails.
 * @example
 * // Get the current user's status and location
 * const currentStatus = await getCurrentMemberStatus();
 * if (currentStatus) {
 *   console.log(`Status: ${currentStatus.status}, Location: ${currentStatus.location}`);
 * }
 */
export async function getCurrentMemberStatus() {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("space_members")
    .select("status, location")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(error.message);
  }

  return data;
}

export async function getMemberSessionAggregations(
  spaceId: string,
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      space_member_id,
      started_at,
      ended_at,
      space_member:space_members!inner(*)
    `
    )
    .eq("space_members.space_id", spaceId)
    .not("ended_at", "is", null)
    .gte("started_at", startDate)
    .lte("ended_at", endDate);

  if (error) throw new Error(error.message);
  if (!data) return {};

  // Aggregate session durations by space_member_id
  const aggregations = data.reduce(
    (acc, session) => {
      const memberId = session.space_member_id;
      if (!memberId) return acc;

      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at!).getTime();
      const duration = end - start;

      acc[memberId] = (acc[memberId] || 0) + duration;
      return acc;
    },
    {} as Record<string, number>
  );

  return aggregations;
}

export async function getTracksWithSessionData(spaceId: string) {
  // Get all tracks for the space
  const { data: tracks, error: tracksError } = await supabase
    .from("tracks")
    .select("*")
    .eq("space_id", spaceId);

  if (tracksError) throw new Error(tracksError.message);
  if (!tracks || tracks.length === 0) return [];

  // Get all sessions for these tracks with member and profile data
  const trackIds = tracks.map(track => track.id);
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(`
      *,
      space_member:space_members!inner(*),
      track:tracks!inner(*)
    `)
    .in("track_id", trackIds)
    .not("ended_at", "is", null);

  if (sessionsError) throw new Error(sessionsError.message);

  // Get unique user IDs from sessions
  const uniqueUserIds = [
    ...new Set(
      (sessions || [])
        .map((session) => session.space_member?.user_id)
        .filter((id): id is string => id !== null)
    ),
  ];

  // Fetch profiles for all unique users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniqueUserIds);

  if (profilesError) throw new Error(profilesError.message);

  // Create a map of user IDs to profiles for quick lookup
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  // Process each track with its session data
  return tracks.map((track) => {
    const trackSessions = (sessions || []).filter(session => session.track_id === track.id);
    
    // Calculate total time
    const totalTime = trackSessions.reduce((total, session) => {
      if (!session.ended_at) return total;
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      return total + (end - start);
    }, 0);

    // Get unique participants
    const participantIds = [...new Set(
      trackSessions
        .map(session => session.space_member?.user_id)
        .filter((id): id is string => id !== null)
    )];

    const participants = participantIds.map(userId => {
      const profile = profileMap.get(userId);
      return {
        id: userId,
        name: profile?.full_name || 'Unknown',
        avatar_url: profile?.avatar_url || `https://www.gravatar.com/avatar/${btoa((profile?.full_name || 'Unknown').trim().toLowerCase())}`
      };
    });

    return {
      ...track,
      totalTime,
      participants,
      sessionCount: trackSessions.length
    };
  });
}

// Session Duration Change Requests
export const getSessionChangeRequests = async (spaceId: string) => {
  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .select(`
      *,
      session:sessions!inner(
        *,
        track:tracks!inner(
          id,
          title,
          space_id
        ),
        space_member:space_members!inner(
          id,
          user_id,
          nickname
        )
      )
    `)
    .eq("session.track.space_id", spaceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  // Get unique user IDs from space members and reviewers
  const uniqueUserIds = [
    ...new Set([
      ...data
        .map((request) => request.session?.space_member?.user_id)
        .filter((id): id is string => id !== null),
      ...data
        .map((request) => request.reviewed_by)
        .filter((id): id is string => id !== null)
    ]),
  ];

  // Early return if no user IDs to avoid empty .in() query
  if (uniqueUserIds.length === 0) {
    return data.map((request) => ({
      ...request,
      reviewer_profile: null,
      session: request.session
        ? {
            ...request.session,
            space_member: request.session.space_member
              ? {
                  ...request.session.space_member,
                  profile: null,
                }
              : null,
          }
        : null,
    }));
  }

  // Fetch profiles for all unique users
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", uniqueUserIds);

  if (profilesError) throw new Error(profilesError.message);

  // Create a map of user IDs to profiles for quick lookup
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  // Combine the data
  return data.map((request) => ({
    ...request,
    reviewer_profile: request.reviewed_by
      ? profileMap.get(request.reviewed_by)
      : null,
    session: request.session
      ? {
          ...request.session,
          space_member: request.session.space_member
            ? {
                ...request.session.space_member,
                profile: request.session.space_member.user_id
                  ? profileMap.get(request.session.space_member.user_id)
                  : null,
              }
            : null,
        }
      : null,
  }));
};

export const getSessionChangeRequest = async (requestId: string) => {
  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .select(`
      *,
      session:sessions!inner(
        *,
        track:tracks!inner(
          id,
          title,
          space_id
        ),
        space_member:space_members!inner(
          id,
          user_id,
          nickname
        )
      )
    `)
    .eq("id", requestId)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// =====================================================
// TIME OFF QUERIES
// =====================================================

/**
 * Fetches time off requests for a space with optional filtering
 */
export const getTimeOffRequests = async (
  spaceId: string,
  filters?: {
    status?: "pending" | "approved" | "rejected" | "cancelled";
    userId?: string;
    spaceMemberId?: string;
  }
) => {
  let query = supabase
    .from("time_off_requests")
    .select(`
      *,
      space_member:space_members!inner(
        id,
        user_id,
        nickname
      )
    `)
    .eq("space_id", spaceId)
    .order("requested_at", { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters?.spaceMemberId) {
    query = query.eq("space_member_id", filters.spaceMemberId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  if (!data || data.length === 0) {
    return [];
  }

  // Collect all user IDs (requesters and reviewers)
  const userIds = new Set<string>();
  data.forEach((request: any) => {
    if (request.space_member?.user_id) {
      userIds.add(request.space_member.user_id);
    }
    if (request.reviewed_by) {
      userIds.add(request.reviewed_by);
    }
  });

  // Fetch all profiles at once
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", Array.from(userIds));

  if (profileError) throw new Error(profileError.message);

  // Create a profile map
  const profileMap = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  // Map profiles to requests
  return data.map((request: any) => ({
    ...request,
    space_member: {
      ...request.space_member,
      profile: request.space_member?.user_id
        ? profileMap.get(request.space_member.user_id)
        : null,
    },
    reviewer_profile: request.reviewed_by
      ? profileMap.get(request.reviewed_by)
      : null,
  }));
};

/**
 * Fetches a single time off request by ID
 */
export const getTimeOffRequestById = async (requestId: string) => {
  const { data, error } = await supabase
    .from("time_off_requests")
    .select(`
      *,
      space_member:space_members!inner(
        id,
        user_id,
        nickname
      )
    `)
    .eq("id", requestId)
    .single();

  if (error) throw new Error(error.message);

  // Collect user IDs to fetch profiles
  const userIds: string[] = [];
  if (data.space_member?.user_id) {
    userIds.push(data.space_member.user_id);
  }
  if (data.reviewed_by) {
    userIds.push(data.reviewed_by);
  }

  // Fetch profiles if needed
  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profileError) throw new Error(profileError.message);

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    );

    return {
      ...data,
      space_member: {
        ...data.space_member,
        profile: data.space_member?.user_id
          ? profileMap.get(data.space_member.user_id)
          : null,
      },
      reviewer_profile: data.reviewed_by
        ? profileMap.get(data.reviewed_by)
        : null,
    };
  }

  return data;
};

/**
 * Checks for conflicting time off requests for a space member
 */
export const checkTimeOffConflicts = async (
  spaceMemberId: string,
  startDate: string,
  endDate: string,
  excludeRequestId?: string
) => {
  const { data, error } = await supabase.rpc("check_time_off_conflicts", {
    p_space_member_id: spaceMemberId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_exclude_request_id: excludeRequestId || null,
  });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Gets team time off for a date range (for calendar view)
 */
export const getTeamTimeOff = async (
  spaceId: string,
  startDate: string,
  endDate: string,
  statusFilter?: ("pending" | "approved" | "rejected" | "cancelled")[]
) => {
  const { data, error } = await supabase.rpc("get_team_time_off", {
    p_space_id: spaceId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_status_filter: statusFilter || ["approved"],
  });

  if (error) throw new Error(error.message);
  return data || [];
};

/**
 * Gets time off statistics for a space member
 */
export const getUserTimeOffStats = async (
  spaceId: string,
  userId: string,
  year?: number
) => {
  const currentYear = year || new Date().getFullYear();
  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const { data, error } = await supabase
    .from("time_off_requests")
    .select("total_days, status, type")
    .eq("space_id", spaceId)
    .eq("user_id", userId)
    .gte("start_date", startDate)
    .lte("end_date", endDate);

  if (error) throw new Error(error.message);

  // Calculate statistics
  const stats = {
    total_days_requested: 0,
    total_days_approved: 0,
    total_days_pending: 0,
    by_type: {} as Record<string, number>,
  };

  data?.forEach((request) => {
    const days = Number(request.total_days);
    stats.total_days_requested += days;

    if (request.status === "approved") {
      stats.total_days_approved += days;
      stats.by_type[request.type] =
        (stats.by_type[request.type] || 0) + days;
    } else if (request.status === "pending") {
      stats.total_days_pending += days;
    }
  });

  return stats;
};

// =====================================================
// GITHUB REPO PERMISSIONS
// =====================================================

export async function getRepoPermissions(spaceId: string) {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("github_repo_permissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("space_id", spaceId)
    .order("repo_owner")
    .order("repo_name");

  if (error) throw new Error(`Failed to fetch repo permissions: ${error.message}`);

  return data || [];
}

export async function getRepoPermission(
  spaceId: string,
  repoOwner: string,
  repoName: string
) {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("github_repo_permissions")
    .select("*")
    .eq("user_id", user.id)
    .eq("space_id", spaceId)
    .eq("repo_owner", repoOwner)
    .eq("repo_name", repoName)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch repo permission: ${error.message}`);
  }

  return data || null;
}

// =====================================================
// MEMBER STATISTICS QUERIES
// =====================================================

/**
 * Fetches a specific member with their profile information
 */
export async function getMemberById(memberId: string, spaceId: string) {
  const { data: member, error: memberError } = await supabase
    .from("space_members")
    .select("*")
    .eq("id", memberId)
    .eq("space_id", spaceId)
    .single();

  if (memberError) {
    if (memberError.code === "PGRST116") return null; // Not found
    throw new Error(memberError.message);
  }

  // Fetch the profile for this member
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", member.user_id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    throw new Error(profileError.message);
  }

  return {
    member,
    profile,
  };
}

/**
 * Fetches all sessions for a specific member with date filtering
 * Includes track and tag information
 */
export async function getMemberSessions(
  spaceMemberId: string,
  startDate: string,
  endDate: string
) {
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      `
      *,
      track:tracks(*),
      tags:session_tags(tag:tags(*))
    `
    )
    .eq("space_member_id", spaceMemberId)
    .not("ended_at", "is", null)
    .gte("started_at", startDate)
    .lte("ended_at", endDate)
    .order("started_at", { ascending: false });

  if (sessionsError) throw new Error(sessionsError.message);
  if (!sessions) return { sessions: [], totalSessions: 0, totalDuration: 0 };

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, session) => {
    if (!session.ended_at) return sum;
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    return sum + (end - start);
  }, 0);

  return { sessions, totalSessions, totalDuration };
}

/**
 * Fetches track statistics for a specific member
 * Returns tracks the member has worked on with session counts and durations
 */
export async function getMemberTrackStats(
  spaceMemberId: string,
  startDate: string,
  endDate: string
) {
  // Get all sessions for this member in the date range
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      `
      *,
      track:tracks(*)
    `
    )
    .eq("space_member_id", spaceMemberId)
    .not("ended_at", "is", null)
    .gte("started_at", startDate)
    .lte("ended_at", endDate);

  if (sessionsError) throw new Error(sessionsError.message);
  if (!sessions || sessions.length === 0) return [];

  // Group sessions by track
  const trackStatsMap = new Map();

  sessions.forEach((session) => {
    if (!session.track) return;

    const trackId = session.track.id;
    if (!trackStatsMap.has(trackId)) {
      trackStatsMap.set(trackId, {
        track: session.track,
        sessionCount: 0,
        totalDuration: 0,
      });
    }

    const stats = trackStatsMap.get(trackId);
    stats.sessionCount += 1;

    if (session.ended_at) {
      const start = new Date(session.started_at).getTime();
      const end = new Date(session.ended_at).getTime();
      stats.totalDuration += end - start;
    }
  });

  return Array.from(trackStatsMap.values());
}

/**
 * Fetches active session for a specific member
 */
export async function getMemberActiveSession(spaceMemberId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      track:tracks(*),
      tags:session_tags(tag:tags(*))
    `
    )
    .eq("space_member_id", spaceMemberId)
    .is("ended_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
