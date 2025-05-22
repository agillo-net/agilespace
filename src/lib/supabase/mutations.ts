import { getSupabaseClient } from "@/lib/supabase/client";

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

export async function createOrganization({
  name,
  slug,
  avatar_url,
  github_org_id,
}: {
  name: string;
  slug: string;
  avatar_url: string;
  github_org_id: string;
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("organizations").insert({
    name,
    slug,
    avatar_url,
    github_org_id,
  });
  if (error) throw new Error(error.message);
}

export async function createOrganizationMember({
  organization_id,
  user_id,
  role = "admin",
}: {
  organization_id: string;
  user_id: string;
  role?: "admin" | "member" | "observer";
}) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("organization_members").insert({
    organization_id,
    user_id,
    role,
  });
  if (error) throw new Error(error.message);
}
