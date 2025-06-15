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

export async function endSession(session_id: string, comment_url?: string, skip_summary?: boolean) {
  const { data, error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
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
