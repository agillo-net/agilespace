import { getSupabaseClient } from "@/lib/supabase/client";
import { getOrganizationByGithubId, getUser } from "./queries";

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


export async function createOrganizationWithMember({
  name,
  slug,
  avatar_url,
  github_org_id,
  user_id,
}: {
  name: string;
  slug: string;
  avatar_url: string;
  github_org_id: string;
  user_id: string;
}) {
  const supabase = getSupabaseClient();

  // First check if organization exists
  const existingOrg = await getOrganizationByGithubId(github_org_id);
  if (existingOrg) {
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("*")
      .eq("organization_id", existingOrg.id)
      .eq("user_id", user_id)
      .single();

    if (!existingMember) {
      // Add user as member if not already a member
      await createOrganizationMember({
        organization_id: existingOrg.id,
        user_id,
        role: "admin",
      });
    }
    return existingOrg;
  }

  // Create new organization
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      avatar_url,
      github_org_id,
    })
    .select()
    .single();

  if (orgError) throw new Error(orgError.message);

  // Add user as member
  await createOrganizationMember({
    organization_id: newOrg.id,
    user_id,
    role: "admin",
  });

  return newOrg;
}
