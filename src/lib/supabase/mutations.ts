import { getSupabaseClient } from "@/lib/supabase/client";
import { getUser } from "./queries";
import type { Tag } from "@/types";

const supabase = getSupabaseClient();

export async function createProfile() {
  const user = await getUser();
  const userId = user?.id;
  if (!userId) throw new Error("User ID is required");

  const { provider_id: github_id, preferred_username: github_username, full_name, avatar_url } = user.user_metadata;
  if (!github_id || !full_name || !github_username) {
    throw new Error("User metadata is incomplete");
  }

  // Ensure the profile is created in the "profiles" table
  const { error } = await supabase.from("profiles").insert({
    id: userId,
    full_name,
    github_username,
    github_id,
    avatar_url,
  });
  if (error) throw new Error(error.message);
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

export async function logout() {

  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function createSession({
  github_issue_url,
  space_member_id,
}: {
  github_issue_url: string;
  space_member_id: string;
}) {

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      github_issue_url,
      space_member_id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function endSession(session_id: string, comment_url?: string, skip_summary?: boolean, ended_at: string = new Date().toISOString()) {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at,
      comment_url,
      skipped_summary: skip_summary
    })
    .eq("id", session_id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}


export async function createTag(spaceId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from('tags')
    .insert({ space_id: spaceId, name, color })
    .select()
    .single()

  if (error) throw error
  return data as Tag
}

export async function updateTag(id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) {
  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Tag
}

export async function deleteTag(id: string) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function linkTagToSession(sessionId: string, tagId: string) {
  const { error } = await supabase
    .from('session_tags')
    .insert({ session_id: sessionId, tag_id: tagId })

  if (error) throw error
}

export async function unlinkTagFromSession(sessionId: string, tagId: string) {
  const { error } = await supabase
    .from('session_tags')
    .delete()
    .match({ session_id: sessionId, tag_id: tagId })

  if (error) throw error
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
  status: string
  location: string
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
  const validStatuses = ['online', 'offline'];
  const validLocations = ['office', 'remote'];
  if (!validStatuses.includes(status) || !validLocations.includes(location)) {
    throw new Error("Invalid status or location");
  }

  // Update the space member's status and location
  const { data, error } = await supabase
    .from('space_members')
    .update({
      status,
      location,
      last_status_update_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

