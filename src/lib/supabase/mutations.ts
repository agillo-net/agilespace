import { getSupabaseClient } from "@/lib/supabase/client";
import { getUser } from "./queries";

export async function createProfile({
  id,
  full_name,
  github_username,
}: {
  id: string;
  full_name: string;
  github_username: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("profiles").insert({
    id,
    full_name,
    github_username,
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
  const supabase = getSupabaseClient();
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

  const supabase = getSupabaseClient();

  const { error } = await supabase.from("space_members").insert({
    space_id,
    user_id: userId,
    role,
  });
  if (error) throw new Error(error.message);
}
