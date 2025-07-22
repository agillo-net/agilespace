import { getSupabaseClient } from "@/lib/supabase/client";
import { getUser } from "./queries";
import type { Tag } from "@/types";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabaseClient();

export async function getOrCreateProfile(user: User) {
  if (!user) throw new Error("User is required");

  // First, try to get the profile
  const { data: existingProfile, error: getError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (getError && getError.code !== "PGRST116") {
    // PGRST116 is 'Not Found'
    throw new Error(`Failed to fetch profile: ${getError.message}`);
  }

  if (existingProfile) {
    return existingProfile;
  }

  // If profile doesn't exist, create it.
  const {
    provider_id: github_id,
    preferred_username: github_username,
    full_name,
    avatar_url,
  } = user.user_metadata;
  if (!github_id || !full_name || !github_username) {
    throw new Error("User metadata is incomplete for profile creation");
  }

  const { data: newProfile, error: createError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      full_name,
      github_username,
      github_id,
      avatar_url,
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create profile: ${createError.message}`);
  }

  return newProfile;
}

export async function createSpace({
  name,
  slug,
  avatar_url,
  github_org_id,
}: {
  name: string;
  slug: string;
  avatar_url: string;
  github_org_id: number;
}) {
  const { data, error } = await supabase
    .from("spaces")
    .insert({
      name,
      slug,
      avatar_url,
      github_org_id,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createSpaceMember({
  space_id,
  role = "admin",
}: {
  space_id: string;
  role?: "admin" | "member" | "observer";
}) {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { error } = await supabase.from("space_members").insert({
    space_id,
    user_id: userId,
    role,
  });
  if (error) throw new Error(error.message);
}

export async function createTrack({
  space_id,
  repo_owner,
  repo_name,
  issue_number,
  title,
}: {
  space_id: string;
  repo_owner: string;
  repo_name: string;
  issue_number: number;
  title: string;
}) {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { data, error } = await supabase
    .from("tracks")
    .insert({
      space_id,
      repo_owner,
      repo_name,
      issue_number,
      title,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function createSession({
  track_id,
  space_member_id,
}: {
  track_id: string;
  space_member_id: string;
}) {
  // 1. Find all active sessions for this space_member_id
  const { data: activeSessions, error: findError } = await supabase
    .from("sessions")
    .select("id")
    .eq("space_member_id", space_member_id)
    .is("ended_at", null);
  if (findError) throw new Error(findError.message);

  // 2. If more than one active session, delete all of them
  if (activeSessions && activeSessions.length > 1) {
    const ids = activeSessions.map((s: { id: string }) => s.id);
    const { error: deleteError } = await supabase
      .from("sessions")
      .delete()
      .in("id", ids);
    if (deleteError) throw new Error(deleteError.message);
  }

  // 3. If only one active session, do not create a new one, throw error
  if (activeSessions && activeSessions.length === 1) {
    throw new Error(
      "You already have an active session. Please end it before starting a new one."
    );
  }

  // 4. Create the new session
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      track_id,
      space_member_id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function endSession(
  session_id: string,
  comment_url?: string,
  skip_summary?: boolean,
  ended_at: string = new Date().toISOString()
) {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at,
      comment_url,
      skipped_summary: skip_summary,
    })
    .eq("id", session_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
}

export async function createTag(spaceId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from("tags")
    .insert({ space_id: spaceId, name, color })
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

export async function updateTag(
  id: string,
  updates: Partial<Pick<Tag, "name" | "color">>
) {
  const { data, error } = await supabase
    .from("tags")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Tag;
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) throw error;
}

export async function linkTagToSession(sessionId: string, tagId: string) {
  const { error } = await supabase
    .from("session_tags")
    .insert({ session_id: sessionId, tag_id: tagId });

  if (error) throw error;
}

export async function unlinkTagFromSession(sessionId: string, tagId: string) {
  const { error } = await supabase
    .from("session_tags")
    .delete()
    .match({ session_id: sessionId, tag_id: tagId });

  if (error) throw error;
}

/**
 * Updates the status and location of the current user in the space_members table.
 * This function is used to set the user's online/offline status and their current working location (office/remote).
 * @param {Object} params - The parameters for the update.
 * @param {string} params.status - The online/offline status to set for the user.
 * @param {string} params.location - The working location to set for the user (office/remote).
 * @returns {Promise<Object>} The updated space member data.
 * @throws {Error} If the user ID is not found, or if the status/location is invalid, or if the update fails.
 * @example
 * // Update the current user's status to online and location to office
 * const updatedMember = await updateMemberStatus({
 *   status: 'online',
 *   location: 'office'
 * });
 */
export async function updateMemberStatus({
  status,
  location,
}: {
  status: string;
  location: string;
}) {
  // Get the current user
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  // Validate status and location
  if (!status || !location) {
    throw new Error("Status and location are required");
  }

  // Check if status and location is valid (online, offline) | (office, remote)
  const validStatuses = ["online", "offline"];
  const validLocations = ["office", "remote"];
  if (!validStatuses.includes(status) || !validLocations.includes(location)) {
    throw new Error("Invalid status or location");
  }

  // Update the space member's status and location
  const { data, error } = await supabase
    .from("space_members")
    .update({
      status,
      location,
      last_status_update_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Session Duration Change Requests
export async function createSessionChangeRequest({
  sessionId,
  originalStartedAt,
  originalEndedAt,
  requestedStartedAt,
  requestedEndedAt,
  reason,
}: {
  sessionId: string;
  originalStartedAt: string;
  originalEndedAt: string | null;
  requestedStartedAt: string;
  requestedEndedAt: string | null;
  reason?: string;
}) {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .insert({
      session_id: sessionId,
      requested_by: user.id,
      original_started_at: originalStartedAt,
      original_ended_at: originalEndedAt,
      requested_started_at: requestedStartedAt,
      requested_ended_at: requestedEndedAt,
      reason,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function approveSessionChangeRequest(requestId: string) {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  // Get the change request first
  const { data: request, error: requestError } = await supabase
    .from("session_duration_change_requests")
    .select("*, session_id, requested_started_at, requested_ended_at")
    .eq("id", requestId)
    .single();

  if (requestError) throw new Error(requestError.message);
  if (!request) throw new Error("Change request not found");

  // Update the session with new times
  const { error: sessionUpdateError } = await supabase
    .from("sessions")
    .update({
      started_at: request.requested_started_at,
      ended_at: request.requested_ended_at,
    })
    .eq("id", request.session_id);

  if (sessionUpdateError) throw new Error(sessionUpdateError.message);

  // Update the change request status
  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejectSessionChangeRequest(requestId: string) {
  const user = await getUser();
  if (!user) throw new Error("Authentication required");

  const { data, error } = await supabase
    .from("session_duration_change_requests")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
